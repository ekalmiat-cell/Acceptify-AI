"use client";

import { apiFetch } from "@/lib/api-client";
import type {
  ApplicationOutcome,
  MatchCategory,
  PredictionHistoryEntry,
} from "@/types/domain";

export async function createPrediction(input: {
  universityId: string;
  matchScore: number;
  category: MatchCategory;
  status?: PredictionHistoryEntry["status"];
}): Promise<PredictionHistoryEntry> {
  return apiFetch<PredictionHistoryEntry>("/api/v1/predictions", {
    method: "POST",
    body: JSON.stringify({
      universityId: input.universityId,
      matchScore: input.matchScore,
      category: input.category,
      status: input.status ?? "Analyzed",
    }),
  });
}

/**
 * Records what actually happened to a saved prediction.
 *
 * This is the only way the platform ever learns whether its scores mean
 * anything: a prediction with no outcome is an opinion nobody checked. The
 * server stamps the reporting time itself rather than trusting a client
 * clock — see `reportOutcome` in lib/data/predictions.ts.
 */
export async function reportPredictionOutcome(
  predictionId: string,
  outcome: ApplicationOutcome
): Promise<PredictionHistoryEntry> {
  return apiFetch<PredictionHistoryEntry>(`/api/v1/predictions/${predictionId}/outcome`, {
    method: "PATCH",
    body: JSON.stringify({ outcome }),
  });
}
