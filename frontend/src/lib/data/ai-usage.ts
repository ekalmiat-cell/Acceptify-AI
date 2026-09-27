import "server-only";

import { AI_LIMITS, type AiFeature } from "@/lib/ai-limits";
import { pgPool } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

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

/** How many uses of `feature` the user has left in the current hour. */
export async function aiAllowanceLeft(userId: string, feature: AiFeature): Promise<number> {
  const result = await pgPool.query<{ count: number }>(
    `SELECT count FROM ai_usage
     WHERE user_id = $1 AND feature = $2 AND window_start = date_trunc('hour', now())`,
    [userId, feature],
  );
  return Math.max(0, AI_LIMITS[feature].perHour - (result.rows[0]?.count ?? 0));
}
