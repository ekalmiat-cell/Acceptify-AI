import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth-helper";
import { pgPool } from "@/lib/db";

export const dynamic = "force-dynamic";

async function ensureTable() {
  await pgPool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL,
      key VARCHAR NOT NULL,
      achieved BOOLEAN NOT NULL DEFAULT false,
      value VARCHAR,
      level VARCHAR,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT uq_achievements_user_id_key UNIQUE (user_id, key)
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
      `SELECT id, user_id, key, achieved, value, level
       FROM achievements WHERE user_id = $1`,
      [userId]
    );

    const rows = result.rows.map((row) => ({
      id: String(row.id),
      userId: row.user_id,
      key: row.key,
      achieved: Boolean(row.achieved),
      value: row.value,
      level: row.level,
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error("[api/v1/profile/achievements] GET error:", error);
    return NextResponse.json({ detail: "Database error" }, { status: 500 });
  }
}
