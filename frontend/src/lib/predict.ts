import { ACADEMIC_CRITERIA, ALL_CRITERIA, DEFAULT_WEIGHTS } from "@/lib/criteria";
import type { AchievementCriterionKey, CriterionKey } from "@/lib/criteria";
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
  /** Whether the student has each non-academic achievement — keyed by the
   * same criterion key an evaluation profile weights against. Missing keys
   * are treated as not-yet-achieved, same as the achievements catalog. */
  achievements: Partial<Record<AchievementCriterionKey, boolean>>;
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

/** A program's evaluation weights, as loaded from its EvaluationProfile —
 * see `lib/programs-client.ts`. Falls back to `DEFAULT_WEIGHTS` wherever no
 * program has been selected/resolved yet. */
export type CriterionWeights = Partial<Record<CriterionKey, number>>;

// ACT and the national exam (ENT) aren't tied to a specific university's
// stated range, so they're compared against a fixed, generally-competitive
// baseline instead.
const ACT_COMPETITIVE_BASELINE = 33;
const ENT_COMPETITIVE_BASELINE = 120;

// Criteria grouped for the four named cards the Analysis page shows. Purely
// presentational — the headline score is always the flat weighted average
// over every criterion, and a weighted average of these bucket averages
// (weighted by each bucket's total weight) is mathematically identical to
// that flat average, so the breakdown always agrees with the headline score.
const BREAKDOWN_GROUPS: Record<keyof ScoreBreakdown, readonly CriterionKey[]> = {
  academicStrength: ACADEMIC_CRITERIA,
  activities: ["olympiads", "hackathons", "startup", "business", "sports", "music", "arts"],
  leadership: ["leadership", "mun", "debate", "communityService"],
  achievements: [
    "ap",
    "ib",
    "aLevel",
    "honors",
    "research",
    "publications",
    "awards",
    "recommendationLetters",
    "personalEssay",
  ],
};

function categoryFor(score: number): MatchCategory {
  if (score >= 70) return "safe";
  if (score < 40) return "reach";
  return "target";
}

/** The 0-100 fit signal for a single criterion, or `null` if the student
 * hasn't provided a value for it (only possible for academic criteria —
 * achievements always resolve to achieved/not-achieved). */
function computeSignal(
  criterion: CriterionKey,
  university: University,
  profile: StudentProfileInput
): number | null {
  switch (criterion) {
    case "gpa":
      return profile.gpa != null ? clamp01(profile.gpa / university.minGpa) * 100 : null;
    case "sat": {
      if (profile.satScore == null) return null;
      const satMid = (university.satLow + university.satHigh) / 2;
      return clamp01(profile.satScore / satMid) * 100;
    }
    case "act":
      return profile.actScore != null
        ? clamp01(profile.actScore / ACT_COMPETITIVE_BASELINE) * 100
        : null;
    case "ielts":
      return profile.ieltsScore != null
        ? clamp01(profile.ieltsScore / university.ieltsMin) * 100
        : null;
    case "toefl":
      return profile.toeflScore != null
        ? clamp01(profile.toeflScore / university.toeflMin) * 100
        : null;
    case "ent":
      return profile.entScore != null
        ? clamp01(profile.entScore / ENT_COMPETITIVE_BASELINE) * 100
        : null;
    default:
      return profile.achievements[criterion] ? 100 : 0;
  }
}

function weightedAverage(
  criteria: readonly CriterionKey[],
  signals: Partial<Record<CriterionKey, number | null>>,
  weights: CriterionWeights
): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const criterion of criteria) {
    const signal = signals[criterion];
    const weight = weights[criterion] ?? 0;
    if (signal == null || weight <= 0) continue;
    weightedSum += signal * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Computes the four named components (each 0-100) shown on the Analysis
 * page's breakdown. Shared by `predictMatch` (for the single headline score
 * used across the app) and `lib/scoring.ts`, so both always agree.
 */
export function computeScoreBreakdown(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const signals: Partial<Record<CriterionKey, number | null>> = {};
  for (const criterion of ALL_CRITERIA) {
    signals[criterion] = computeSignal(criterion, university, profile);
  }

  return {
    academicStrength: weightedAverage(BREAKDOWN_GROUPS.academicStrength, signals, weights),
    activities: weightedAverage(BREAKDOWN_GROUPS.activities, signals, weights),
    leadership: weightedAverage(BREAKDOWN_GROUPS.leadership, signals, weights),
    achievements: weightedAverage(BREAKDOWN_GROUPS.achievements, signals, weights),
  };
}

/** Each breakdown bucket's total weight (as a share of all present-criteria
 * weight), used to label the Analysis page's "X% weight" cards with the
 * program's real, program-specific weighting instead of a fixed split. */
export function computeBreakdownWeights(
  weights: CriterionWeights = DEFAULT_WEIGHTS
): Record<keyof ScoreBreakdown, number> {
  const totals = Object.fromEntries(
    Object.entries(BREAKDOWN_GROUPS).map(([bucket, criteria]) => [
      bucket,
      criteria.reduce((sum, c) => sum + (weights[c] ?? 0), 0),
    ])
  ) as Record<keyof ScoreBreakdown, number>;

  const grandTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
  if (grandTotal <= 0) return totals;

  return Object.fromEntries(
    Object.entries(totals).map(([bucket, value]) => [bucket, Math.round((value / grandTotal) * 100)])
  ) as Record<keyof ScoreBreakdown, number>;
}

/**
 * Deterministic, explainable scoring used to power the admission prediction
 * UI — no external AI call. Weighs every admission criterion (academic fit
 * against the university's stated bar, plus every achievement/activity)
 * using the target program's evaluation profile, then adjusts for the
 * university's selectivity so a strong profile still reads as a "Reach" at
 * a 4%-acceptance school.
 */
export function predictMatch(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights = DEFAULT_WEIGHTS
): MatchResult {
  const signals: Partial<Record<CriterionKey, number | null>> = {};
  for (const criterion of ALL_CRITERIA) {
    signals[criterion] = computeSignal(criterion, university, profile);
  }

  const raw = weightedAverage(ALL_CRITERIA, signals, weights);

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
