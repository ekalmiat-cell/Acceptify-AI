import "server-only";

import { apiFetchServer } from "@/lib/api-server";
import type { EssayReviewRead, EssayReviewSummaryRead } from "@/types/essay";

/**
 * Server-side loader for listing user's essay reviews.
 */
export async function listEssayReviewsServer(): Promise<EssayReviewSummaryRead[]> {
  try {
    return await apiFetchServer<EssayReviewSummaryRead[]>("/api/v1/essays");
  } catch {
    return [];
  }
}

/**
 * Server-side loader for fetching a specific essay review by ID.
 */
export async function getEssayReviewServer(id: string): Promise<EssayReviewRead | null> {
  try {
    return await apiFetchServer<EssayReviewRead>(`/api/v1/essays/${id}`);
  } catch {
    return null;
  }
}
