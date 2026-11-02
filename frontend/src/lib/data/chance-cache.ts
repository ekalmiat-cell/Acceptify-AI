import "server-only";

import { pgPool } from "@/lib/db";
import type { ChanceEstimate } from "@/types/chance";

/** Cached AI estimates: see db/migrations/0009_chance_cache.sql. */

const MAX_AGE = "30 days";

export async function getCachedChance(cacheKey: string): Promise<ChanceEstimate | null> {
  const result = await pgPool.query<{ payload: ChanceEstimate }>(
    `SELECT payload FROM ai_chance_cache
     WHERE cache_key = $1 AND created_at > now() - interval '${MAX_AGE}'`,
    [cacheKey],
  );
  return result.rows[0]?.payload ?? null;
}

/**
 * Stores an estimate. Best-effort: a failure to cache only means the next
 * request asks the model again, never an error for the student.
 */
export async function saveCachedChance(cacheKey: string, estimate: ChanceEstimate): Promise<void> {
  try {
    await pgPool.query(
      `INSERT INTO ai_chance_cache (cache_key, university_id, payload)
       VALUES ($1, $2, $3)
       ON CONFLICT (cache_key) DO UPDATE SET payload = EXCLUDED.payload, created_at = now()`,
      [cacheKey, estimate.universityId, JSON.stringify(estimate)],
    );
    if (Math.random() < 0.02) {
      await pgPool.query(`DELETE FROM ai_chance_cache WHERE created_at < now() - interval '${MAX_AGE}'`);
    }
  } catch (error) {
    console.error("[chance-cache] could not save", error);
  }
}
