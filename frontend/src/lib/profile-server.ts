import "server-only";
import { cache } from "react";

import {
  EMPTY_ACADEMIC_PROFILE,
  getAcademicProfile as readAcademicProfile,
  listAchievements,
} from "@/lib/data/profile";
import { getCurrentUserId } from "@/lib/session";
import type { AcademicProfile, AchievementRecord } from "@/types/domain";

/**
 * The signed-in user's academic profile, read straight from Postgres.
 *
 * Wrapped in `cache()` so the dashboard's several components share one query
 * per request; a mutation followed by `router.refresh()` starts a new request
 * with an empty cache. Signed out, it is the empty profile.
 */
export const getAcademicProfile = cache(async (): Promise<AcademicProfile> => {
  const userId = await getCurrentUserId();
  return userId ? readAcademicProfile(userId) : EMPTY_ACADEMIC_PROFILE;
});

export const getAchievementRecords = cache(async (): Promise<AchievementRecord[]> => {
  const userId = await getCurrentUserId();
  return userId ? listAchievements(userId) : [];
});
