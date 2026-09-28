"use client";

import { apiFetch } from "@/lib/api-client";
import type { DrillFeedbackResponse, TrainingProgress } from "@/types/training";

/** How long the browser waits for the AI coach before giving up. */
const COACH_TIMEOUT_MS = 70_000;

/** Marks a drill finished; returns the updated streak and progress. */
export async function completeDrill(drillId: string): Promise<TrainingProgress> {
  return apiFetch<TrainingProgress>("/api/v1/training/complete", {
    method: "POST",
    body: JSON.stringify({ drill_id: drillId }),
  });
}

/** Asks the AI coach about one attempt; it answers in the interface language. */
export async function askDrillCoach(payload: { drill_id: string; answer: string }): Promise<DrillFeedbackResponse> {
  return apiFetch<DrillFeedbackResponse>("/api/v1/training/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(COACH_TIMEOUT_MS),
  });
}
