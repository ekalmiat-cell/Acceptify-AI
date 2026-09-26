import "server-only";
import { randomBytes } from "node:crypto";
import { unstable_cache } from "next/cache";
import type { PoolClient } from "pg";

import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import { pgPool, withTransaction } from "@/lib/db";
import type { EvaluationProfile, Program } from "@/types/domain";

/**
 * Programs and their evaluation weights:
 *
 *   university -> program -> evaluation profile -> evaluation weights
 *
 * The weights decide how every student applying to that program is scored,
 * so all writes here are admin-only — except `resolveProgram`, which a
 * student triggers by picking a field of study and which only ever creates
 * a program with the platform default weights.
 */

/** Cache tag for programs and profiles; call `revalidateTag` after writes. */
export const PROGRAMS_TAG = "programs";

const PROGRAMS_REVALIDATE_SECONDS = 300;

interface ProgramRow {
  id: string;
  university_id: string;
  slug: string;
  name: string;
  field: string;
  parent_program_id: string | null;
  level: Program["level"];
  description: string | null;
}

interface ProfileRow {
  id: string;
  program_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

const PROGRAM_COLUMNS =
  "id, university_id, slug, name, field, parent_program_id, level, description";

function toProgram(row: ProgramRow): Program {
  return {
    id: row.id,
    universityId: row.university_id,
    slug: row.slug,
    name: row.name,
    field: row.field,
    parentProgramId: row.parent_program_id,
    level: row.level,
    description: row.description,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// ── Reads ────────────────────────────────────────────────────────────────────

const loadAllPrograms = unstable_cache(
  async (): Promise<Program[]> => {
    const result = await pgPool.query<ProgramRow>(
      `SELECT ${PROGRAM_COLUMNS} FROM programs ORDER BY name ASC`,
    );
    return result.rows.map(toProgram);
  },
  ["programs-all"],
  { revalidate: PROGRAMS_REVALIDATE_SECONDS, tags: [PROGRAMS_TAG] },
);

/** Every program, or only those at one university. */
export async function listPrograms(universityId?: string): Promise<Program[]> {
  const programs = await loadAllPrograms();
  return universityId
    ? programs.filter((program) => program.universityId === universityId)
    : programs;
}

export async function getProgram(id: string, client: Pick<PoolClient, "query"> = pgPool) {
  const result = await client.query<ProgramRow>(
    `SELECT ${PROGRAM_COLUMNS} FROM programs WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? toProgram(result.rows[0]) : null;
}

async function readEvaluationProfile(
  client: Pick<PoolClient, "query">,
  programId: string,
): Promise<EvaluationProfile | null> {
  const profileResult = await client.query<ProfileRow>(
    `SELECT id, program_id, name, description, is_active
     FROM evaluation_profiles WHERE program_id = $1`,
    [programId],
  );
  const profile = profileResult.rows[0];
  if (!profile) return null;

  const weightResult = await client.query<{ criterion_key: string; weight: number }>(
    `SELECT criterion_key, weight FROM evaluation_weights
     WHERE evaluation_profile_id = $1 ORDER BY criterion_key`,
    [profile.id],
  );

  return {
    id: String(profile.id),
    programId: profile.program_id,
    name: profile.name,
    description: profile.description,
    isActive: profile.is_active,
    weights: weightResult.rows.map((row) => ({
      criterionKey: row.criterion_key,
      weight: row.weight,
    })),
  };
}

const loadEvaluationProfile = unstable_cache(
  async (programId: string) => readEvaluationProfile(pgPool, programId),
  ["evaluation-profile"],
  { revalidate: PROGRAMS_REVALIDATE_SECONDS, tags: [PROGRAMS_TAG] },
);

/** A program's evaluation weights, or `null` when it has none yet. */
export async function getEvaluationProfile(programId: string) {
  return loadEvaluationProfile(programId);
}

// ── Writes ───────────────────────────────────────────────────────────────────

async function insertDefaultProfile(
  client: PoolClient,
  programId: string,
  name: string,
): Promise<void> {
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO evaluation_profiles (program_id, name)
     VALUES ($1, $2)
     ON CONFLICT (program_id) DO NOTHING
     RETURNING id`,
    [programId, name],
  );
  const profileId = inserted.rows[0]?.id;
  if (!profileId) return;

  const entries = Object.entries(DEFAULT_WEIGHTS);
  await client.query(
    `INSERT INTO evaluation_weights (evaluation_profile_id, criterion_key, weight)
     SELECT $1, key, weight
     FROM unnest($2::varchar[], $3::double precision[]) AS w(key, weight)`,
    [profileId, entries.map(([key]) => key), entries.map(([, weight]) => weight)],
  );
}

export interface ProgramInput {
  universityId: string;
  name: string;
  field: string;
  parentProgramId?: string | null;
  description?: string | null;
}

export async function createProgram(input: ProgramInput): Promise<Program> {
  const slug = slugify(input.name);
  const id = `prog-${slugify(input.universityId)}-${slug}-${randomBytes(3).toString("hex")}`;

  const result = await pgPool.query<ProgramRow>(
    `INSERT INTO programs (id, university_id, slug, name, field, parent_program_id, level, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PROGRAM_COLUMNS}`,
    [
      id,
      input.universityId,
      slug,
      input.name,
      input.field,
      input.parentProgramId ?? null,
      input.parentProgramId ? "specialization" : "program",
      input.description ?? null,
    ],
  );
  return toProgram(result.rows[0]);
}

export type ProgramPatch = Partial<Omit<ProgramInput, "universityId">>;

/** Updates only the fields present on `patch`. */
export async function updateProgram(id: string, patch: ProgramPatch): Promise<Program | null> {
  const columns: Record<keyof ProgramPatch, string> = {
    name: "name",
    field: "field",
    parentProgramId: "parent_program_id",
    description: "description",
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const key of Object.keys(columns) as (keyof ProgramPatch)[]) {
    if (patch[key] === undefined) continue;
    values.push(patch[key]);
    sets.push(`${columns[key]} = $${values.length}`);
  }
  if ("parentProgramId" in patch && patch.parentProgramId !== undefined) {
    values.push(patch.parentProgramId ? "specialization" : "program");
    sets.push(`level = $${values.length}`);
  }

  if (sets.length === 0) return getProgram(id);

  values.push(id);
  const result = await pgPool.query<ProgramRow>(
    `UPDATE programs SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $${values.length}
     RETURNING ${PROGRAM_COLUMNS}`,
    values,
  );
  return result.rows[0] ? toProgram(result.rows[0]) : null;
}

/**
 * Deletes a program with its evaluation profile and weights. Returns false
 * when it does not exist. Specializations under it are detached, not deleted.
 */
export async function deleteProgram(id: string): Promise<boolean> {
  return withTransaction(async (client) => {
    await client.query(
      `DELETE FROM evaluation_weights WHERE evaluation_profile_id IN
         (SELECT id FROM evaluation_profiles WHERE program_id = $1)`,
      [id],
    );
    await client.query("DELETE FROM evaluation_profiles WHERE program_id = $1", [id]);
    await client.query(
      "UPDATE programs SET parent_program_id = NULL, level = 'program' WHERE parent_program_id = $1",
      [id],
    );
    const deleted = await client.query("DELETE FROM programs WHERE id = $1", [id]);
    return (deleted.rowCount ?? 0) > 0;
  });
}

/**
 * The program for a (university, field of study) pair, created on first use
 * with a default-weighted evaluation profile. This backs the "Choose your
 * intended field of study" step, so the catalog grows from real choices
 * rather than needing every field pre-seeded at every university.
 *
 * Safe under concurrency: the id is deterministic and both inserts are
 * ON CONFLICT DO NOTHING, so two students picking the same pair at the same
 * moment end up with one program.
 */
export async function resolveProgram(universityId: string, field: string): Promise<Program> {
  return withTransaction(async (client) => {
    const existing = await client.query<ProgramRow>(
      `SELECT ${PROGRAM_COLUMNS} FROM programs
       WHERE university_id = $1 AND field = $2
       ORDER BY created_at ASC LIMIT 1`,
      [universityId, field],
    );
    if (existing.rows[0]) return toProgram(existing.rows[0]);

    const id = `prog-${slugify(universityId)}-${slugify(field)}`;
    await client.query(
      `INSERT INTO programs (id, university_id, slug, name, field, level)
       VALUES ($1, $2, $3, $4, $4, 'program')
       ON CONFLICT (id) DO NOTHING`,
      [id, universityId, slugify(field), field],
    );
    await insertDefaultProfile(client, id, `${field} — default profile`);

    const program = await getProgram(id, client);
    if (!program) throw new Error(`Program ${id} vanished right after it was created`);
    return program;
  });
}

export interface EvaluationProfileInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  /** When present, replaces the profile's entire set of weights. */
  weights?: { criterionKey: string; weight: number }[];
}

/** Creates or updates a program's evaluation profile. */
export async function saveEvaluationProfile(
  program: Program,
  input: EvaluationProfileInput,
): Promise<EvaluationProfile> {
  return withTransaction(async (client) => {
    const upserted = await client.query<{ id: string }>(
      `INSERT INTO evaluation_profiles (program_id, name, description, is_active)
       VALUES ($1, $2, $3, COALESCE($4, true))
       ON CONFLICT (program_id) DO UPDATE SET
         name = COALESCE($5, evaluation_profiles.name),
         description = CASE WHEN $6 THEN $3 ELSE evaluation_profiles.description END,
         is_active = COALESCE($4, evaluation_profiles.is_active),
         updated_at = now()
       RETURNING id`,
      [
        program.id,
        input.name ?? `${program.name} — profile`,
        input.description ?? null,
        input.isActive ?? null,
        input.name ?? null,
        input.description !== undefined,
      ],
    );
    const profileId = upserted.rows[0].id;

    if (input.weights) {
      await client.query("DELETE FROM evaluation_weights WHERE evaluation_profile_id = $1", [
        profileId,
      ]);
      await client.query(
        `INSERT INTO evaluation_weights (evaluation_profile_id, criterion_key, weight)
         SELECT $1, key, weight
         FROM unnest($2::varchar[], $3::double precision[]) AS w(key, weight)`,
        [
          profileId,
          input.weights.map((entry) => entry.criterionKey),
          input.weights.map((entry) => entry.weight),
        ],
      );
    }

    const profile = await readEvaluationProfile(client, program.id);
    if (!profile) throw new Error(`Evaluation profile for ${program.id} vanished after saving`);
    return profile;
  });
}
