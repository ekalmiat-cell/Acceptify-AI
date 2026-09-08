import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/api-auth-helper";
import { pgPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ predictionId: string }> }
) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { predictionId } = await params;

  try {
    const body = await req.json();
    const result = await pgPool.query(
      `UPDATE predictions
       SET outcome = $1, outcome_reported_at = now(), updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING id, user_id, university_id, match_score, category, status, outcome, outcome_reported_at, created_at`,
      [body.outcome, predictionId, userId]
    );

    const row = result.rows[0];
    if (!row) {
      return NextResponse.json({ detail: "Prediction not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(row.id),
      userId: row.user_id,
      universityId: row.university_id,
      matchScore: row.match_score,
      category: row.category,
      status: row.status,
      outcome: row.outcome,
      outcomeReportedAt: row.outcome_reported_at?.toISOString?.() ?? null,
      createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/v1/predictions/outcome] PUT error:", error);
    return NextResponse.json({ detail: "Failed to update prediction outcome" }, { status: 500 });
  }
}
