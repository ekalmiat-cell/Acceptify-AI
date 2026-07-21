"use client";

import { apiFetch } from "@/lib/api-client";
import type { AcademicProfile, AchievementRecord } from "@/types/domain";

export async function updateAcademicProfile(profile: AcademicProfile): Promise<AcademicProfile> {
  return apiFetch<AcademicProfile>("/api/v1/profile/academics", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function upsertAchievement(
  key: string,
  patch: { achieved: boolean; value: string | null; level: string | null }
): Promise<AchievementRecord> {
  return apiFetch<AchievementRecord>(`/api/v1/profile/achievements/${key}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}
