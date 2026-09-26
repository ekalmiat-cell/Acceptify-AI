import "server-only";

import { listEssayReviews } from "@/lib/data/essays";
import { getCurrentUserId } from "@/lib/session";
import type { EssayReviewSummaryRead } from "@/types/essay";

/** The signed-in user's essay reviews, newest first. */
export async function listEssayReviewsServer(): Promise<EssayReviewSummaryRead[]> {
  const userId = await getCurrentUserId();
  return userId ? listEssayReviews(userId) : [];
}

