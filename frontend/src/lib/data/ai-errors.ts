import "server-only";

import { GeminiError } from "@/lib/ai/gemini";
import { pgPool } from "@/lib/db";
import { HttpError } from "@/lib/http-error";

/**
 * A small log of AI failures for the health check. Stores what failed and
 * why — never who, and never what they wrote.
 */

export interface AiErrorEntry {
  feature: string;
  status: number;
  message: string;
  upstream: string | null;
  at: string;
}

/**
 * Records a failure. Best-effort: logging must never turn into a second
 * error for the student, so any problem here is swallowed.
 */
export async function recordAiError(feature: string, error: unknown): Promise<void> {
  const status = error instanceof HttpError ? error.status : 500;
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const upstream = error instanceof GeminiError ? error.upstream : null;

  try {
    await pgPool.query(
      `INSERT INTO ai_error_log (feature, status, message, upstream) VALUES ($1, $2, $3, $4)`,
      [feature, status, message.slice(0, 1000), upstream?.slice(0, 1000) ?? null],
    );
    if (Math.random() < 0.05) {
      await pgPool.query("DELETE FROM ai_error_log WHERE created_at < now() - interval '7 days'");
    }
  } catch (logError) {
    console.error("[ai-errors] could not record", logError);
  }
}

export async function recentAiErrors(limit = 10): Promise<AiErrorEntry[]> {
  const result = await pgPool.query<{
    feature: string;
    status: number;
    message: string;
    upstream: string | null;
    created_at: Date;
  }>(
    `SELECT feature, status, message, upstream, created_at
     FROM ai_error_log ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((row) => ({
    feature: row.feature,
    status: row.status,
    message: row.message,
    upstream: row.upstream,
    at: row.created_at.toISOString(),
  }));
}

/**
 * Runs an AI request handler body, recording any failure before rethrowing
 * it so the student still gets the same response.
 */
export async function withAiErrorLog<T>(feature: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    await recordAiError(feature, error);
    throw error;
  }
}
