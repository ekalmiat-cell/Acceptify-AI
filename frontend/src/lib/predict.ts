import type { MatchCategory, University } from "@/types/domain";

export interface StudentProfileInput {
  /** Any of these six may be null — only the ones the student has actually
   * filled in are used, so a profile with just an ENT score still produces
   * a real (if lower-confidence) academic fit instead of being blocked. */
  gpa: number | null;
  satScore: number | null;
  actScore: number | null;
  ieltsScore: number | null;
  toeflScore: number | null;
  entScore: number | null;
  /** 0-1: share of achieved items among Competitions + Talents catalog groups. */
  activitiesRatio: number;
  /** 0-1: share of achieved items among the Activities catalog group (leadership, MUN, debate). */
  leadershipRatio: number;
  /** 0-1: share of achieved items among the Credentials catalog group (research, publications, volunteering). */
  achievementsRatio: number;
}

export interface MatchResult {
  score: number;
  category: MatchCategory;
}

export interface ScoreBreakdown {
  academicStrength: number;
  activities: number;
  leadership: number;
  achievements: number;
}

/** Weights for each component of the admission scoring engine — must sum to 100. */
export const SCORE_WEIGHTS = {
  academicStrength: 40,
  activities: 25,
  leadership: 15,
  achievements: 20,
} as const;

// Relative weights among the academic signals — only renormalized over
// whichever ones the student has actually provided, so filling in just one
// (e.g. only a national exam score) still produces a real academic fit.
const ACADEMIC_SIGNAL_WEIGHTS = {
  gpa: 30,
  sat: 25,
  act: 20,
  ielts: 15,
  toefl: 10,
  ent: 15,
} as const;

// ACT and the national exam (ENT) aren't tied to a specific university's
// stated range, so they're compared against a fixed, generally-competitive
// baseline instead.
const ACT_COMPETITIVE_BASELINE = 33;
const ENT_COMPETITIVE_BASELINE = 120;

function categoryFor(score: number): MatchCategory {
  if (score >= 70) return "safe";
  if (score < 40) return "reach";
  return "target";
}

/**
 * Computes the four named components (each 0-100) the admission scoring
 * engine weighs together. Shared by `predictMatch` (for the single headline
 * score used across the app) and `lib/scoring.ts` (for the full explainable
 * breakdown on the Analysis page), so both always agree with each other.
 */
export function computeScoreBreakdown(
  university: University,
  profile: StudentProfileInput
): ScoreBreakdown {
  const satMid = (university.satLow + university.satHigh) / 2;

  const signals: { fit: number; weight: number }[] = [];
  if (profile.gpa != null) {
    signals.push({ fit: clamp01(profile.gpa / university.minGpa) * 100, weight: ACADEMIC_SIGNAL_WEIGHTS.gpa });
  }
  if (profile.satScore != null) {
    signals.push({ fit: clamp01(profile.satScore / satMid) * 100, weight: ACADEMIC_SIGNAL_WEIGHTS.sat });
  }
  if (profile.actScore != null) {
    signals.push({
      fit: clamp01(profile.actScore / ACT_COMPETITIVE_BASELINE) * 100,
      weight: ACADEMIC_SIGNAL_WEIGHTS.act,
    });
  }
  if (profile.ieltsScore != null) {
    signals.push({ fit: clamp01(profile.ieltsScore / university.ieltsMin) * 100, weight: ACADEMIC_SIGNAL_WEIGHTS.ielts });
  }
  if (profile.toeflScore != null) {
    signals.push({ fit: clamp01(profile.toeflScore / university.toeflMin) * 100, weight: ACADEMIC_SIGNAL_WEIGHTS.toefl });
  }
  if (profile.entScore != null) {
    signals.push({
      fit: clamp01(profile.entScore / ENT_COMPETITIVE_BASELINE) * 100,
      weight: ACADEMIC_SIGNAL_WEIGHTS.ent,
    });
  }

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const academicStrength =
    totalWeight > 0 ? signals.reduce((sum, s) => sum + s.fit * s.weight, 0) / totalWeight : 0;

  return {
    academicStrength,
    activities: clamp01(profile.activitiesRatio) * 100,
    leadership: clamp01(profile.leadershipRatio) * 100,
    achievements: clamp01(profile.achievementsRatio) * 100,
  };
}

/**
 * Deterministic, explainable scoring used to power the admission prediction
 * UI — no external AI call. Weighs academic fit against the university's
 * stated bar (40%), extracurricular activity breadth (25%), leadership
 * experience (15%), and achievement credentials (20%), then adjusts for the
 * university's selectivity so a strong profile still reads as a "Reach" at
 * a 4%-acceptance school.
 */
export function predictMatch(
  university: University,
  profile: StudentProfileInput
): MatchResult {
  const breakdown = computeScoreBreakdown(university, profile);

  const raw =
    breakdown.academicStrength * (SCORE_WEIGHTS.academicStrength / 100) +
    breakdown.activities * (SCORE_WEIGHTS.activities / 100) +
    breakdown.leadership * (SCORE_WEIGHTS.leadership / 100) +
    breakdown.achievements * (SCORE_WEIGHTS.achievements / 100);

  const selectivityPenalty = (100 - university.acceptanceRate) / 100;
  const adjusted =
    raw * (0.55 + 0.45 * (university.acceptanceRate / 100)) - selectivityPenalty * 8;

  const score = Math.round(clamp(adjusted, 2, 98));

  return { score, category: categoryFor(score) };
}

export const matchCategoryMeta: Record<
  MatchCategory,
  { label: string; description: string }
> = {
  safe: {
    label: "Safe",
    description: "Your profile comfortably exceeds typical admits.",
  },
  target: {
    label: "Target",
    description: "A realistic, competitive match for your profile.",
  },
  reach: {
    label: "Reach",
    description: "Highly competitive — a stretch worth applying for.",
  },
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1.15);
}
