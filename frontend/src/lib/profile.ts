import { achievementCatalog } from "@/data/achievement-catalog";
import type { AchievementCriterionKey } from "@/lib/criteria";
import type { StudentProfileInput } from "@/lib/predict";
import type { AcademicProfile, AchievementRecord, ResolvedAchievement } from "@/types/domain";

const ACADEMIC_FIELD_COUNT = 6;

/** Merges the static achievement catalog with a user's real records. Items
 * the user hasn't filled in render as not-yet-achieved. */
export function resolveAchievements(records?: AchievementRecord[] | null): ResolvedAchievement[] {
  const safeRecords = Array.isArray(records) ? records : [];
  const byKey = new Map(safeRecords.map((r) => [r.key, r]));

  return achievementCatalog.map((item) => {
    const record = byKey.get(item.id);
    return {
      ...item,
      achieved: record?.achieved ?? false,
      value: record?.value ?? null,
      level: record?.level ?? null,
      progress: record?.achieved ? 100 : 0,
    };
  });
}

function countFilledAcademicFields(academic?: AcademicProfile | null): number {
  if (!academic) return 0;
  return [
    academic.gpa,
    academic.satScore,
    academic.actScore,
    academic.ieltsScore,
    academic.toeflScore,
    academic.entScore,
  ].filter((value) => value != null).length;
}

/** Percentage of the profile (academic fields + achievements) that's
 * actually been filled in — computed from real data, never fabricated. */
export function computeProfileCompleteness(
  academic?: AcademicProfile | null,
  achievements?: ResolvedAchievement[] | null
): number {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const total = ACADEMIC_FIELD_COUNT + safeAchievements.length;
  if (total === 0) return 0;

  const filled = countFilledAcademicFields(academic) + safeAchievements.filter((a) => a.achieved).length;
  return Math.round((filled / total) * 100);
}

/** Per-group {achieved, total} tallies for the academic fields plus each
 * achievement catalog group. */
export function computeGroupProgress(
  academic?: AcademicProfile | null,
  achievements?: ResolvedAchievement[] | null
): { group: string; achieved: number; total: number }[] {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const groups = Array.from(new Set(achievementCatalog.map((item) => item.group)));

  return [
    {
      group: "Academics",
      achieved: countFilledAcademicFields(academic),
      total: ACADEMIC_FIELD_COUNT,
    },
    ...groups.map((group) => {
      const items = safeAchievements.filter((a) => a.group === group);
      return {
        group,
        achieved: items.filter((a) => a.achieved).length,
        total: items.length,
      };
    }),
  ];
}

/** True as soon as a single academic field is filled in — the match
 * prediction engine renormalizes over whichever signals are present, so a
 * profile with e.g. only an ENT score already produces a real (if
 * lower-confidence) analysis instead of being blocked entirely. */
export function hasAnyAcademicProfile(academic?: AcademicProfile | null): boolean {
  return countFilledAcademicFields(academic) > 0;
}

export function toStudentProfileInput(
  academic?: AcademicProfile | null,
  achievements?: ResolvedAchievement[] | null
): StudentProfileInput {
  const safeAchievements = Array.isArray(achievements) ? achievements : [];
  const achievedMap: Partial<Record<AchievementCriterionKey, boolean>> = {};
  for (const achievement of safeAchievements) {
    achievedMap[achievement.id as AchievementCriterionKey] = achievement.achieved;
  }

  return {
    gpa: academic?.gpa ?? null,
    satScore: academic?.satScore ?? null,
    actScore: academic?.actScore ?? null,
    ieltsScore: academic?.ieltsScore ?? null,
    toeflScore: academic?.toeflScore ?? null,
    entScore: academic?.entScore ?? null,
    achievements: achievedMap,
  };
}
