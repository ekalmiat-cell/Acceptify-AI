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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;

  try {
    await ensureTable();
    const body = await req.json();

    const result = await pgPool.query(
      `INSERT INTO achievements (id, user_id, key, achieved, value, level, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id, key) DO UPDATE SET
         achieved = EXCLUDED.achieved,
         value = EXCLUDED.value,
         level = EXCLUDED.level,
         updated_at = now()
       RETURNING id, user_id, key, achieved, value, level`,
      [
        userId,
        key,
        Boolean(body.achieved),
        body.value ?? null,
        body.level ?? null,
      ]
    );

    const row = result.rows[0];
    return NextResponse.json({
      id: String(row.id),
      userId: row.user_id,
      key: row.key,
      achieved: Boolean(row.achieved),
      value: row.value,
      level: row.level,
    });
  } catch (error) {
    console.error("[api/v1/profile/achievements/[key]] PUT error:", error);
    return NextResponse.json({ detail: "Failed to update achievement" }, { status: 500 });
  }
}
