"use client";

import { apiFetch } from "@/lib/api-client";
import type { MatchCategory, PredictionHistoryEntry } from "@/types/domain";

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
