import { achievementCatalog } from "@/data/achievement-catalog";
import type { StudentProfileInput } from "@/lib/predict";
import type { AcademicProfile, AchievementRecord, ResolvedAchievement } from "@/types/domain";

const ACADEMIC_FIELD_COUNT = 6;

/** Merges the static achievement catalog with a user's real records. Items
 * the user hasn't filled in render as not-yet-achieved. */
export function resolveAchievements(records: AchievementRecord[]): ResolvedAchievement[] {
  const byKey = new Map(records.map((r) => [r.key, r]));

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

function countFilledAcademicFields(academic: AcademicProfile): number {
  return [
    academic.gpa,
    academic.satScore,
    academic.actScore,
    academic.ieltsScore,
    academic.toeflScore,
    academic.entScore,
  ].filter((value) => value != null).length;
}

function achievedRatio(achievements: ResolvedAchievement[], groups: string[]): number {
  const items = achievements.filter((a) => groups.includes(a.group));
  if (items.length === 0) return 0;
  return items.filter((a) => a.achieved).length / items.length;
}

/** Percentage of the profile (academic fields + achievements) that's
 * actually been filled in — computed from real data, never fabricated. */
export function computeProfileCompleteness(
  academic: AcademicProfile,
  achievements: ResolvedAchievement[]
): number {
  const total = ACADEMIC_FIELD_COUNT + achievements.length;
  if (total === 0) return 0;

  const filled = countFilledAcademicFields(academic) + achievements.filter((a) => a.achieved).length;
  return Math.round((filled / total) * 100);
}

/** Per-group {achieved, total} tallies for the academic fields plus each
 * achievement catalog group. */
export function computeGroupProgress(
  academic: AcademicProfile,
  achievements: ResolvedAchievement[]
): { group: string; achieved: number; total: number }[] {
  const groups = Array.from(new Set(achievementCatalog.map((item) => item.group)));

  return [
    {
      group: "Academics",
      achieved: countFilledAcademicFields(academic),
      total: ACADEMIC_FIELD_COUNT,
    },
    ...groups.map((group) => {
      const items = achievements.filter((a) => a.group === group);
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
export function hasAnyAcademicProfile(academic: AcademicProfile): boolean {
  return countFilledAcademicFields(academic) > 0;
}

export function toStudentProfileInput(
  academic: AcademicProfile,
  achievements: ResolvedAchievement[]
): StudentProfileInput {
  return {
    gpa: academic.gpa,
    satScore: academic.satScore,
    actScore: academic.actScore,
    ieltsScore: academic.ieltsScore,
    toeflScore: academic.toeflScore,
    entScore: academic.entScore,
    activitiesRatio: achievedRatio(achievements, ["Competitions", "Talents"]),
    leadershipRatio: achievedRatio(achievements, ["Activities"]),
    achievementsRatio: achievedRatio(achievements, ["Credentials"]),
  };
}
