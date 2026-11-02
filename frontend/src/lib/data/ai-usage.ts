import "server-only";

import { dailyLimit, SITE_AI_LIMITS, type AiFeature } from "@/lib/ai-limits";
import { pgPool } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

/** The counter row that totals a feature across every user (not a real user id). */
export const SITE_USER_ID = "__site__";

/**
 * Counts one use of `feature` against the user's allowance for the current
 * day and the whole site's, or throws a 429 when either is already spent.
 * Atomic: each increment and its check are one statement, so parallel
 * requests cannot both slip under.
 */
export async function consumeAiAllowance(userId: string, feature: AiFeature, admin = false): Promise<void> {
  const perDay = dailyLimit(feature, admin);

  // The site-wide counter goes first, and only moves while it is under the
  // cap, so a refused request never inflates it. The admin is counted but
  // never refused, so they can still look into a day that ran out.
  const siteCap = admin ? 2_147_483_647 : SITE_AI_LIMITS[feature];
  const site = await pgPool.query(
    `INSERT INTO ai_usage (user_id, feature, window_start, count)
     VALUES ($1, $2, date_trunc('day', now()), 1)
     ON CONFLICT (user_id, feature, window_start)
       DO UPDATE SET count = ai_usage.count + 1
       WHERE ai_usage.count < $3
     RETURNING count`,
    [SITE_USER_ID, feature, siteCap],
  );
  if (site.rowCount === 0) {
    throw new HttpError(
      429,
      "Today's free AI allowance for the whole site is used up. It resets overnight — please try again tomorrow.",
    );
  }

  const result = await pgPool.query<{ count: number }>(
    `INSERT INTO ai_usage (user_id, feature, window_start, count)
     VALUES ($1, $2, date_trunc('day', now()), 1)
     ON CONFLICT (user_id, feature, window_start)
       DO UPDATE SET count = ai_usage.count + 1
     RETURNING count`,
    [userId, feature],
  );

  if (result.rows[0].count > perDay) {
    // The student's own ceiling refused this one: give the site its slot back.
    await refundCounter(SITE_USER_ID, feature);
    throw new HttpError(
      429,
      `You've used today's ${perDay} for this feature. It refills tomorrow.`,
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

/**
 * Gives back the use counted for a request that then failed (the AI timed
 * out, say): the student got no answer, so it should not cost them a turn.
 * Best-effort, like the logging: a problem here is never a second error.
 */
export async function refundAiAllowance(userId: string, feature: AiFeature): Promise<void> {
  await Promise.all([refundCounter(userId, feature), refundCounter(SITE_USER_ID, feature)]);
}

async function refundCounter(userId: string, feature: AiFeature): Promise<void> {
  await pgPool
    .query(
      `UPDATE ai_usage SET count = GREATEST(count - 1, 0)
       WHERE user_id = $1 AND feature = $2 AND window_start = date_trunc('day', now())`,
      [userId, feature],
    )
    .catch((error) => console.error("[ai-usage] could not refund", error));
}

/** How many uses of `feature` the user has left today. */
export async function aiAllowanceLeft(userId: string, feature: AiFeature, admin = false): Promise<number> {
  const result = await pgPool.query<{ count: number }>(
    `SELECT count FROM ai_usage
     WHERE user_id = $1 AND feature = $2 AND window_start = date_trunc('day', now())`,
    [userId, feature],
  );
  return Math.max(0, dailyLimit(feature, admin) - (result.rows[0]?.count ?? 0));
}
