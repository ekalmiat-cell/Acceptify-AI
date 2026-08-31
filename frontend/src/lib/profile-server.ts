import "server-only";
import { cache } from "react";
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
  dreamProgramId: null,
};

/**
 * The authenticated user's real academic profile from Postgres. Falls back
 * to an all-empty profile (never fabricated values) if the backend call
 * fails, so a hiccup degrades to the empty state instead of crashing.
 *
 * Wrapped in React's `cache()` so the dashboard fetches it once per request
 * instead of three times. Next's own fetch memoization cannot help here:
 * `apiFetchServer` mints a fresh JWT for every call, so each request carries
 * a different `Authorization` header and therefore a different memo key.
 * Memoizing at this level is safe because the value is scoped to a single
 * server request — one user, one render — and a mutation followed by
 * `router.refresh()` starts a new request with an empty cache.
 */
export const getAcademicProfile = cache(async (): Promise<AcademicProfile> => {
  try {
    return await apiFetchServer<AcademicProfile>("/api/v1/profile/academics");
  } catch {
    return EMPTY_ACADEMIC_PROFILE;
  }
});

export const getAchievementRecords = cache(async (): Promise<AchievementRecord[]> => {
  try {
    return await apiFetchServer<AchievementRecord[]>("/api/v1/profile/achievements");
  } catch {
    return [];
  }
});
