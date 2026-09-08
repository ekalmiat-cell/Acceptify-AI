import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth-helper";
import { pgPool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS predictions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      university_id VARCHAR NOT NULL,
      match_score INTEGER NOT NULL,
      category VARCHAR NOT NULL,
      status VARCHAR NOT NULL,
      outcome VARCHAR,
      outcome_reported_at TIMESTAMPTZ,
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
      `SELECT id, user_id, university_id, match_score, category, status, outcome, outcome_reported_at, created_at
       FROM predictions WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const rows = result.rows.map((row) => ({
      id: String(row.id),
      userId: row.user_id,
      universityId: row.university_id,
      matchScore: row.match_score,
      category: row.category,
      status: row.status,
      outcome: row.outcome,
      outcomeReportedAt: row.outcome_reported_at?.toISOString?.() ?? null,
      createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[api/v1/predictions] GET error:", error);
    return NextResponse.json({ detail: "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureTable();
    const body = await req.json();

    const result = await pgPool.query(
      `INSERT INTO predictions (id, user_id, university_id, match_score, category, status, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now(), now())
       RETURNING id, user_id, university_id, match_score, category, status, outcome, outcome_reported_at, created_at`,
      [
        userId,
        body.universityId,
        body.matchScore,
        body.category,
        body.status,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json(
      {
        id: String(row.id),
        userId: row.user_id,
        universityId: row.university_id,
        matchScore: row.match_score,
        category: row.category,
        status: row.status,
        outcome: row.outcome,
        outcomeReportedAt: row.outcome_reported_at?.toISOString?.() ?? null,
        createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/v1/predictions] POST error:", error);
    return NextResponse.json({ detail: "Failed to create prediction" }, { status: 500 });
  }
}
