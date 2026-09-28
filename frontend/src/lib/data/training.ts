import "server-only";

import { pgPool } from "@/lib/db";
import { getEssayReview } from "@/lib/data/essays";
import type { CriterionKey } from "@/lib/essay-rubric";
import { findDrill, type Drill } from "@/lib/training/drills";
import {
  parsePersonalDrillId,
  personalDrill,
  personalDrills,
  type PersonalDrill,
} from "@/lib/training/personal";
import { currentStreak, utcDay, type TrainingProgress } from "@/lib/training/progress";
import { isReviewV2, type AnyEssayAnalysis, type EssayReviewV2 } from "@/types/essay";

/** Training progress, and the essay review the course is personalised from. */

export async function getTrainingProgress(userId: string): Promise<TrainingProgress> {
  const [done, days] = await Promise.all([
    pgPool.query<{ drill_id: string }>("SELECT drill_id FROM training_progress WHERE user_id = $1", [userId]),
    pgPool.query<{ day: string; drills: number }>(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, drills FROM training_days
       WHERE user_id = $1 AND day > current_date - 400 ORDER BY day DESC`,
      [userId],
    ),
  ]);
  const today = utcDay();
  return {
    completed: done.rows.map((row) => row.drill_id),
    streak: currentStreak(
      days.rows.map((row) => row.day),
      today,
    ),
    today: days.rows.find((row) => row.day === today)?.drills ?? 0,
  };
}

/** Marks a drill finished (again) and counts it towards today. */
export async function recordDrillDone(userId: string, drillId: string): Promise<TrainingProgress> {
  const today = utcDay();
  await pgPool.query(
    `INSERT INTO training_progress (user_id, drill_id) VALUES ($1, $2)
     ON CONFLICT (user_id, drill_id) DO UPDATE SET completed_at = now()`,
    [userId, drillId],
  );
  await pgPool.query(
    `INSERT INTO training_days (user_id, day, drills) VALUES ($1, $2::date, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET drills = training_days.drills + 1`,
    [userId, today],
  );
  return getTrainingProgress(userId);
}

export interface LatestReview {
  id: string;
  title: string;
  essayText: string;
  overallScore: number;
  analysis: EssayReviewV2;
}

/** The student's most recent rubric-based review, if they have one. */
export async function getLatestReview(userId: string): Promise<LatestReview | null> {
  const result = await pgPool.query<{
    id: string;
    title: string;
    essay_text: string;
    overall_score: number;
    analysis_result: AnyEssayAnalysis;
  }>(
    `SELECT id, title, essay_text, overall_score, analysis_result FROM essay_reviews
     WHERE user_id = $1 AND analysis_result->>'version' = '2'
     ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const row = result.rows[0];
  if (!row || !isReviewV2(row.analysis_result)) return null;
  return {
    id: String(row.id),
    title: row.title,
    essayText: row.essay_text,
    overallScore: row.overall_score,
    analysis: row.analysis_result,
  };
}

/** The rubric criterion a review scored lowest. */
export function weakestCriterion(review: EssayReviewV2): { key: CriterionKey; score: number } {
  const entries = Object.entries(review.criteria) as [CriterionKey, { score: number }][];
  const [key, value] = entries.reduce((low, entry) => (entry[1].score < low[1].score ? entry : low));
  return { key, score: value.score };
}

export function drillsFromReview(review: LatestReview | null): PersonalDrill[] {
  return review ? personalDrills(review.id, review.title, review.essayText, review.analysis) : [];
}

/**
 * A drill by id: one of the course's, or one made from the user's own essay
 * — looked up by owner, so another student's review id finds nothing.
 */
export async function resolveDrill(userId: string, drillId: string): Promise<Drill | PersonalDrill | null> {
  const personal = parsePersonalDrillId(drillId);
  if (!personal) return findDrill(drillId);

  const review = await getEssayReview(userId, personal.reviewId);
  if (!review || !isReviewV2(review.analysis_result)) return null;
  return personalDrill(review.id, review.title, review.essay_text, review.analysis_result, personal.index);
}
