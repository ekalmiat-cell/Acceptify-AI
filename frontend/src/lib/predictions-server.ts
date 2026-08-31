import "server-only";
import { cache } from "react";
import type { OutcomeSummary, PredictionHistoryEntry } from "@/types/domain";
import { apiFetchServer } from "@/lib/api-server";

/**
 * The authenticated user's real prediction history from the backend
 * (backed by Postgres — see backend/app/models/prediction.py). Returns an
 * empty array rather than throwing so a backend hiccup degrades the
 * dashboard to its empty state instead of crashing the page.
 */
export const getPredictionHistory = cache(async (): Promise<PredictionHistoryEntry[]> => {
  try {
    return await apiFetchServer<PredictionHistoryEntry[]>("/api/v1/predictions");
  } catch {
    return [];
  }
});

/**
 * Platform-wide outcome totals — what the methodology page shows to say, in
 * numbers, how far the model is from being calibrated.
 *
 * Falls back to an empty, explicitly-uncalibrated summary when the backend is
 * unreachable. The failure mode being avoided is a page that silently omits
 * the caveat because a fetch failed.
 */
export const getOutcomeSummary = cache(async (): Promise<OutcomeSummary> => {
  try {
    return await apiFetchServer<OutcomeSummary>("/api/v1/predictions/outcomes/summary");
  } catch {
    return {
      reported: 0,
      admitted: 0,
      rejected: 0,
      waitlisted: 0,
      withdrawn: 0,
      meanScoreAdmitted: null,
      meanScoreRejected: null,
      bands: [],
      isCalibrated: false,
    };
  }
});
