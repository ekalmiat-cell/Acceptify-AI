"use client";

import { apiFetch } from "@/lib/api-client";
import type {
  EssayAnalyzeRequest,
  EssayReviewRead,
  EssayReviewSummaryRead,
} from "@/types/essay";

/** How long the browser waits for an AI review before giving up. */
const ANALYZE_TIMEOUT_MS = 90_000;

/** Runs the AI review of an admissions essay and saves it to the user's history. */
export async function analyzeEssay(payload: EssayAnalyzeRequest): Promise<EssayReviewRead> {
  return apiFetch<EssayReviewRead>("/api/v1/essays/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(ANALYZE_TIMEOUT_MS),
  });
}

/** Lists the signed-in user's previous essay reviews. */
export async function listEssayReviews(): Promise<EssayReviewSummaryRead[]> {
  return apiFetch<EssayReviewSummaryRead[]>("/api/v1/essays");
}

/** Fetches one previous essay review by id. */
export async function getEssayReview(id: string): Promise<EssayReviewRead> {
  return apiFetch<EssayReviewRead>(`/api/v1/essays/${encodeURIComponent(id)}`);
}

/** Permanently deletes an essay review from the user's history. */
export async function deleteEssayReview(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/essays/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
