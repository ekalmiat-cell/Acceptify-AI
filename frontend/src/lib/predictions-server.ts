import "server-only";
import type { PredictionHistoryEntry } from "@/types/domain";
import { apiFetchServer } from "@/lib/api-server";

/**
 * The authenticated user's real prediction history from the backend
 * (backed by Postgres — see backend/app/models/prediction.py). Returns an
 * empty array rather than throwing so a backend hiccup degrades the
 * dashboard to its empty state instead of crashing the page.
 */
export async function getPredictionHistory(): Promise<PredictionHistoryEntry[]> {
  try {
    return await apiFetchServer<PredictionHistoryEntry[]>("/api/v1/predictions");
  } catch {
    return [];
  }
}
