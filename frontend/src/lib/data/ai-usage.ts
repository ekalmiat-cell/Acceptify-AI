import "server-only";

import { pgPool } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

/**
 * Per-user hourly ceilings on the AI features.
 *
 * Gemini's free tier is one quota shared by every user of the deployment, so
 * without a per-user limit a single busy tab could exhaust it for everybody.
 */
export const AI_LIMITS = {
  essay_review: { perHour: 10 },
  copilot: { perHour: 40 },
} as const;

export type AiFeature = keyof typeof AI_LIMITS;

/**
 * Counts one use of `feature` against the user's allowance for the current
 * hour, or throws a 429 when it is already spent. Atomic: the increment and
 * the read are one statement, so parallel requests cannot both slip under.
 */
export async function consumeAiAllowance(userId: string, feature: AiFeature): Promise<void> {
  const { perHour } = AI_LIMITS[feature];

  const result = await pgPool.query<{ count: number }>(
    `INSERT INTO ai_usage (user_id, feature, window_start, count)
     VALUES ($1, $2, date_trunc('hour', now()), 1)
     ON CONFLICT (user_id, feature, window_start)
       DO UPDATE SET count = ai_usage.count + 1
     RETURNING count`,
    [userId, feature],
  );

  if (result.rows[0].count > perHour) {
    throw new HttpError(
      429,
      `You've reached the limit of ${perHour} requests per hour for this feature. Please try again later.`,
    );
  }

  // Old windows are useless once the hour is over; trim them now and then
  // instead of on every request.
  if (Math.random() < 0.02) {
    pgPool
      .query("DELETE FROM ai_usage WHERE window_start < now() - interval '2 days'")
      .catch(() => {});
  }
}
