import { NextResponse } from "next/server";
import { pgPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const SCORE_BANDS: [string, number, number][] = [
  ["Reach (0-39)", 0, 39],
  ["Lower target (40-54)", 40, 54],
  ["Upper target (55-69)", 55, 69],
  ["Safe (70-84)", 70, 84],
  ["Very safe (85-100)", 85, 100],
];

export async function GET() {
  try {
    const result = await pgPool.query(
      `SELECT match_score, outcome FROM predictions WHERE outcome IS NOT NULL`
    );

    const rows = result.rows;
    const counts = { admitted: 0, rejected: 0, waitlisted: 0, withdrawn: 0 };
    const scores: { admitted: number[]; rejected: number[] } = { admitted: [], rejected: [] };

    for (const row of rows) {
      const outcome = row.outcome as keyof typeof counts;
      if (counts[outcome] !== undefined) {
        counts[outcome]++;
      }
      if (outcome === "admitted" || outcome === "rejected") {
        scores[outcome].push(row.match_score);
      }
    }

    const mean = (vals: number[]) =>
      vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;

    const bands = SCORE_BANDS.map(([label, low, high]) => {
      const reported = rows.filter((r) => r.match_score >= low && r.match_score <= high).length;
      const admitted = rows.filter(
        (r) => r.match_score >= low && r.match_score <= high && r.outcome === "admitted"
      ).length;
      const rate = reported > 0 ? Math.round((admitted / reported) * 1000) / 10 : null;
      return {
        label,
        minScore: low,
        maxScore: high,
        reported,
        admitted,
        admitRatePct: rate,
      };
    });

    return NextResponse.json({
      totalReported: rows.length,
      counts,
      admittedMeanScore: mean(scores.admitted),
      rejectedMeanScore: mean(scores.rejected),
      bands,
      isCalibrated: rows.length >= 100,
      minOutcomesToCalibrate: 100,
    });
  } catch (error) {
    console.error("[api/v1/predictions/outcomes/summary] GET error:", error);
    return NextResponse.json({ detail: "Database error" }, { status: 500 });
  }
}
