"use client";

import { apiFetch } from "@/lib/api-client";
import type { ChanceEstimate } from "@/types/chance";

export interface ChanceResponse {
  estimate: ChanceEstimate | null;
  cached: boolean;
  /** Why the plain formula answered instead of the AI, if it did. */
  notice: "limit" | "unavailable" | null;
  /** Estimates still available today. */
  left: number;
}

/** Asks for the AI estimate; `cacheOnly` looks without spending anything. */
export function fetchChance(input: {
  universityId: string;
  programId?: string | null;
  cacheOnly?: boolean;
}): Promise<ChanceResponse> {
  return apiFetch<ChanceResponse>("/api/v1/chance", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
