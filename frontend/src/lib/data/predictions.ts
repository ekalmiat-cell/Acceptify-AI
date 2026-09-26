import "server-only";

import { pgPool } from "@/lib/db";
import type {
  ApplicationOutcome,
  MatchCategory,
  OutcomeSummary,
  PredictionHistoryEntry,
} from "@/types/domain";

/**
 * Saved runs of the admission analysis, and — months later — what actually
 * happened. The score is stored as it was *at the time*: weights get retuned
 * from the admin panel, and a calibration set has to record what was
 * predicted then, not what today's model would say.
 */

interface PredictionRow {
  id: string;
  university_id: string;
  match_score: number;
  category: MatchCategory;
  status: PredictionHistoryEntry["status"];
  outcome: ApplicationOutcome | null;
  outcome_reported_at: Date | null;
  created_at: Date;
}

const PREDICTION_COLUMNS =
  "id, university_id, match_score, category, status, outcome, outcome_reported_at, created_at";

function toEntry(row: PredictionRow): PredictionHistoryEntry {
  return {
    id: String(row.id),
    universityId: row.university_id,
    matchScore: row.match_score,
    category: row.category,
    status: row.status,
    outcome: row.outcome,
    outcomeReportedAt: row.outcome_reported_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listPredictions(userId: string): Promise<PredictionHistoryEntry[]> {
  const result = await pgPool.query<PredictionRow>(
    `SELECT ${PREDICTION_COLUMNS} FROM predictions
     WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows.map(toEntry);
}

export async function createPrediction(
  userId: string,
  input: Pick<PredictionHistoryEntry, "universityId" | "matchScore" | "category" | "status">,
): Promise<PredictionHistoryEntry> {
  const result = await pgPool.query<PredictionRow>(
    `INSERT INTO predictions (user_id, university_id, match_score, category, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${PREDICTION_COLUMNS}`,
    [userId, input.universityId, input.matchScore, input.category, input.status],
  );
  return toEntry(result.rows[0]);
}

/**
 * Records the real outcome of an application. The `user_id` filter is the
 * authorisation check: someone else's prediction id reads as "not found"
 * (null) rather than "forbidden", which would confirm it exists. The report
 * time is the server's, never a client clock.
 */
export async function reportOutcome(
  userId: string,
  predictionId: string,
  outcome: ApplicationOutcome,
): Promise<PredictionHistoryEntry | null> {
  const result = await pgPool.query<PredictionRow>(
    `UPDATE predictions
     SET outcome = $3, outcome_reported_at = now(), updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING ${PREDICTION_COLUMNS}`,
    [predictionId, userId, outcome],
  );
  return result.rows[0] ? toEntry(result.rows[0]) : null;
}

/**
 * The bands the calibration table is reported in. Wide on purpose — a table
 * with twenty rows and three outcomes in it looks like evidence without being
 * any — and the same cut points the app uses to call a university safe
 * (>= 70) or a reach (< 40).
 */
export const SCORE_BANDS: { label: string; minScore: number; maxScore: number }[] = [
  { label: "Reach (0-39)", minScore: 0, maxScore: 39 },
  { label: "Lower target (40-54)", minScore: 40, maxScore: 54 },
  { label: "Upper target (55-69)", minScore: 55, maxScore: 69 },
  { label: "Safe (70-84)", minScore: 70, maxScore: 84 },
  { label: "Very safe (85-100)", minScore: 85, maxScore: 100 },
];

/**
 * Below this many reported outcomes an admit rate per band is noise. A
 * judgement call rather than a statistical test, but declaring a threshold
 * up front is what stops three lucky reports passing for a calibrated model.
 */
export const MIN_OUTCOMES_TO_CALIBRATE = 100;

/** Pure aggregation behind `getOutcomeSummary`, split out to be testable. */
export function summarizeOutcomes(
  rows: { matchScore: number; outcome: ApplicationOutcome }[],
): OutcomeSummary {
  const count = (outcome: ApplicationOutcome) =>
    rows.filter((row) => row.outcome === outcome).length;

  const mean = (outcome: ApplicationOutcome): number | null => {
    const scores = rows.filter((row) => row.outcome === outcome).map((row) => row.matchScore);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10;
  };

  return {
    reported: rows.length,
    admitted: count("admitted"),
    rejected: count("rejected"),
    waitlisted: count("waitlisted"),
    withdrawn: count("withdrawn"),
    meanScoreAdmitted: mean("admitted"),
    meanScoreRejected: mean("rejected"),
    bands: SCORE_BANDS.map((band) => {
      const inBand = rows.filter(
        (row) => row.matchScore >= band.minScore && row.matchScore <= band.maxScore,
      );
      return {
        ...band,
        reported: inBand.length,
        // Waitlists and withdrawals are reported but are not a "yes";
        // counting either as an admission would flatter the model.
        admitted: inBand.filter((row) => row.outcome === "admitted").length,
      };
    }),
    isCalibrated: rows.length >= MIN_OUTCOMES_TO_CALIBRATE,
  };
}

/**
 * Platform-wide outcome totals. Deliberately not scoped to one user: the
 * question is whether the model is any good yet, which one student's four
 * applications cannot answer. Only counts and means leave this function.
 */
export async function getOutcomeSummary(): Promise<OutcomeSummary> {
  const result = await pgPool.query<{ match_score: number; outcome: ApplicationOutcome }>(
    "SELECT match_score, outcome FROM predictions WHERE outcome IS NOT NULL",
  );
  return summarizeOutcomes(
    result.rows.map((row) => ({ matchScore: row.match_score, outcome: row.outcome })),
  );
}
