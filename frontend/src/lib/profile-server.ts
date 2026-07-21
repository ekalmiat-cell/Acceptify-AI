import "server-only";
import { apiFetchServer } from "@/lib/api-server";
import type { AcademicProfile, AchievementRecord } from "@/types/domain";

const EMPTY_ACADEMIC_PROFILE: AcademicProfile = {
  gpa: null,
  satScore: null,
  actScore: null,
  ieltsScore: null,
  toeflScore: null,
  entScore: null,
  dreamUniversityId: null,
};

/** The authenticated user's real academic profile from Postgres. Falls back
 * to an all-empty profile (never fabricated values) if the backend call
 * fails, so a hiccup degrades to the empty state instead of crashing. */
export async function getAcademicProfile(): Promise<AcademicProfile> {
  try {
    return await apiFetchServer<AcademicProfile>("/api/v1/profile/academics");
  } catch {
    return EMPTY_ACADEMIC_PROFILE;
  }
}

export async function getAchievementRecords(): Promise<AchievementRecord[]> {
  try {
    return await apiFetchServer<AchievementRecord[]>("/api/v1/profile/achievements");
  } catch {
    return [];
  }
}
