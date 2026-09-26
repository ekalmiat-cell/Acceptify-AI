import "server-only";
import { cache } from "react";

import { getOutcomeSummary as readOutcomeSummary, listPredictions } from "@/lib/data/predictions";
import { getCurrentUserId } from "@/lib/session";
import type { OutcomeSummary, PredictionHistoryEntry } from "@/types/domain";

/** The signed-in user's prediction history, newest first. */
export const getPredictionHistory = cache(async (): Promise<PredictionHistoryEntry[]> => {
  const userId = await getCurrentUserId();
  return userId ? listPredictions(userId) : [];
});

/**
 * Platform-wide outcome totals — what the methodology page shows to say, in
 * numbers, how far the model is from being calibrated.
 */
export const getOutcomeSummary = cache(async (): Promise<OutcomeSummary> => readOutcomeSummary());
