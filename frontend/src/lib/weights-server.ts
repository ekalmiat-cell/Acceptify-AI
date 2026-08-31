import "server-only";

import { DEFAULT_WEIGHTS, type CriterionKey } from "@/lib/criteria";
import type { CriterionWeights } from "@/lib/predict";
import { getAllPrograms, getEvaluationProfile } from "@/lib/programs-server";
import type { AcademicProfile, EvaluationProfile, Program } from "@/types/domain";

/**
 * Resolving which evaluation weights apply to a given student at a given
 * university — in one place, so every screen answers it the same way.
 *
 * The bug this exists to end: the search page and the dashboard
 * recommendations scored every university with `DEFAULT_WEIGHTS`, while the
 * university page used the student's program weights (but only for their
 * declared dream university) and the analysis page used whichever program
 * was selected in its dropdown. The same student could therefore see three
 * different numbers for the same university on three different screens.
 *
 * The rule, stated once: a student declares one intended field of study. At
 * any university that offers a program in that field, they are measured by
 * that program's weights. Everywhere else — and for students who have not
 * declared a field yet — the platform default applies.
 */

/** Flattens an evaluation profile's rows into the map the engine takes. */
export function toCriterionWeights(profile: EvaluationProfile | null): CriterionWeights | null {
  if (!profile) return null;

  const weights: CriterionWeights = {};
  for (const entry of profile.weights) {
    weights[entry.criterionKey as CriterionKey] = entry.weight;
  }

  // An "empty" profile would make every criterion weightless and score the
  // student at the floor everywhere. Treat it as no profile at all.
  return Object.keys(weights).length > 0 ? weights : null;
}

/**
 * The field of study the student has declared, derived from the program they
 * picked in the field-of-study step. `null` when they haven't chosen one.
 */
export async function getDeclaredField(academic: AcademicProfile): Promise<string | null> {
  if (!academic.dreamProgramId) return null;

  const programs = await getAllPrograms();
  const declared = programs.find((program) => program.id === academic.dreamProgramId);
  return declared?.field ?? null;
}

/** The program at `universityId` matching the student's declared field. */
function programFor(
  programs: Program[],
  universityId: string,
  field: string
): Program | undefined {
  return programs.find(
    (program) => program.universityId === universityId && program.field === field
  );
}

/**
 * Weights for one university. Used by the university detail page, and by the
 * analysis page as its starting point.
 */
export async function resolveWeightsForUniversity(
  academic: AcademicProfile,
  universityId: string
): Promise<CriterionWeights> {
  const field = await getDeclaredField(academic);
  if (!field) return DEFAULT_WEIGHTS;

  const programs = await getAllPrograms();
  const program = programFor(programs, universityId, field);
  if (!program) return DEFAULT_WEIGHTS;

  return toCriterionWeights(await getEvaluationProfile(program.id)) ?? DEFAULT_WEIGHTS;
}

/**
 * Weights for many universities at once — what the search page and the
 * dashboard recommendations need in order to score a whole list.
 *
 * Only universities that actually offer the declared field cost a request,
 * and those go through the reference cache, so a catalog where the student's
 * field exists at three schools costs three cached reads rather than one per
 * university.
 */
export async function resolveWeightsByUniversity(
  academic: AcademicProfile,
  universityIds: string[]
): Promise<Record<string, CriterionWeights>> {
  const field = await getDeclaredField(academic);
  if (!field) return {};

  const programs = await getAllPrograms();

  const matches = universityIds
    .map((universityId) => ({ universityId, program: programFor(programs, universityId, field) }))
    .filter((entry): entry is { universityId: string; program: Program } => Boolean(entry.program));

  const resolved = await Promise.all(
    matches.map(async ({ universityId, program }) => ({
      universityId,
      weights: toCriterionWeights(await getEvaluationProfile(program.id)),
    }))
  );

  const byUniversity: Record<string, CriterionWeights> = {};
  for (const { universityId, weights } of resolved) {
    if (weights) byUniversity[universityId] = weights;
  }
  return byUniversity;
}
