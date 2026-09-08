import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth-helper";
import { pgPool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id VARCHAR PRIMARY KEY,
      gpa DOUBLE PRECISION,
      sat_score INTEGER,
      act_score INTEGER,
      ielts_score DOUBLE PRECISION,
      toefl_score INTEGER,
      ent_score INTEGER,
      dream_university_id VARCHAR,
      dream_program_id VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

export async function GET(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();
    const result = await pgPool.query(
      `SELECT gpa, sat_score, act_score, ielts_score, toefl_score, ent_score, dream_university_id, dream_program_id
       FROM student_profiles WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({
        gpa: null,
        satScore: null,
        actScore: null,
        ieltsScore: null,
        toeflScore: null,
        entScore: null,
        dreamUniversityId: null,
        dreamProgramId: null,
      });
    }

    return NextResponse.json({
      gpa: row.gpa,
      satScore: row.sat_score,
      actScore: row.act_score,
      ieltsScore: row.ielts_score,
      toeflScore: row.toefl_score,
      entScore: row.ent_score,
      dreamUniversityId: row.dream_university_id,
      dreamProgramId: row.dream_program_id,
    });
  } catch (error) {
    console.error("[api/v1/profile/academics] GET error:", error);
    return NextResponse.json({ detail: "Database error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();
    const body = await req.json();

    const result = await pgPool.query(
      `INSERT INTO student_profiles (
         user_id, gpa, sat_score, act_score, ielts_score, toefl_score, ent_score,
         dream_university_id, dream_program_id, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (user_id) DO UPDATE SET
         gpa = EXCLUDED.gpa,
         sat_score = EXCLUDED.sat_score,
         act_score = EXCLUDED.act_score,
         ielts_score = EXCLUDED.ielts_score,
         toefl_score = EXCLUDED.toefl_score,
         ent_score = EXCLUDED.ent_score,
         dream_university_id = EXCLUDED.dream_university_id,
         dream_program_id = EXCLUDED.dream_program_id,
         updated_at = now()
       RETURNING gpa, sat_score, act_score, ielts_score, toefl_score, ent_score, dream_university_id, dream_program_id`,
      [
        userId,
        body.gpa ?? null,
        body.satScore ?? null,
        body.actScore ?? null,
        body.ieltsScore ?? null,
        body.toeflScore ?? null,
        body.entScore ?? null,
        body.dreamUniversityId ?? null,
        body.dreamProgramId ?? null,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({
      gpa: row.gpa,
      satScore: row.sat_score,
      actScore: row.act_score,
      ieltsScore: row.ielts_score,
      toeflScore: row.toefl_score,
      entScore: row.ent_score,
      dreamUniversityId: row.dream_university_id,
      dreamProgramId: row.dream_program_id,
    });
  } catch (error) {
    console.error("[api/v1/profile/academics] PUT error:", error);
    return NextResponse.json({ detail: "Failed to update academic profile" }, { status: 500 });
  }
}
