"use client";

import { apiFetch } from "@/lib/api-client";
import type {
  EssayAnalyzeRequest,
  EssayReviewRead,
  EssayReviewSummaryRead,
} from "@/types/essay";

/**
 * Triggers the AI analysis of an admissions essay via the FastAPI backend.
 */
export async function analyzeEssay(payload: EssayAnalyzeRequest): Promise<EssayReviewRead> {
  return apiFetch<EssayReviewRead>("/api/v1/essays/analyze", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Lists the authenticated user's previous essay reviews.
 */
export async function listEssayReviews(): Promise<EssayReviewSummaryRead[]> {
  return apiFetch<EssayReviewSummaryRead[]>("/api/v1/essays");
}

/**
 * Fetches a full previous essay review by ID.
 */
export async function getEssayReview(id: string): Promise<EssayReviewRead> {
  return apiFetch<EssayReviewRead>(`/api/v1/essays/${id}`);
}

/**
 * Permanently deletes an essay review from the user's history.
 */
export async function deleteEssayReview(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/essays/${id}`, {
    method: "DELETE",
  });
}
