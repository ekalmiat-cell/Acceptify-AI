import { ACADEMIC_CRITERIA, ALL_CRITERIA, DEFAULT_WEIGHTS } from "@/lib/criteria";
import type {
  AcademicCriterionKey,
  AchievementCriterionKey,
  CriterionKey,
} from "@/lib/criteria";
import { academicBenchmark } from "@/lib/benchmarks";
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
  /**
   * The **fit score**: 2-98, how well this profile matches what this
   * program asks for, weighted by that program's evaluation model and
   * discounted for the university's selectivity.
   *
   * It is deliberately *not* a probability of admission, and must never be
   * labelled as one in the UI. It is a weighted mean of "your result over
   * the stated bar" ratios: a 70 means the profile sits comfortably above
   * the bars this program weights, not that 70% of such students get in.
   * Turning it into a probability needs the base rate as well — that
   * conversion lives in `lib/probability.ts` and is labelled as an estimate
   * wherever it is shown.
   */
  score: number;
  category: MatchCategory;
}

/**
 * Each named component of the breakdown, 0-100 — or `null` when the
 * component does not apply to this student/program at all: either the
 * program weights every criterion in it at 0, or the student has provided
 * nothing that it scores. `null` is not "you scored zero" and must not be
 * rendered as 0%, which is how it read before.
 */
export interface ScoreBreakdown {
  academicStrength: number | null;
  activities: number | null;
  leadership: number | null;
  achievements: number | null;
}

/** A program's evaluation weights, as loaded from its EvaluationProfile —
 * see `lib/programs-client.ts`. Falls back to `DEFAULT_WEIGHTS` wherever no
 * program has been selected/resolved yet. */
export type CriterionWeights = Partial<Record<CriterionKey, number>>;

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

/** The reported score never reaches 0 or 100 — see `predictMatch`. Exported
 * so tests can assert the invariant against the same constants the engine
 * uses rather than restating them. */
export const SCORE_FLOOR = 2;
export const SCORE_CEILING = 98;

function categoryFor(score: number): MatchCategory {
  if (score >= 70) return "safe";
  if (score < 40) return "reach";
  return "target";
}

/**
 * A student's result measured against the bar it has to clear, as a 0-115
 * signal — or `null` when the comparison cannot be made.
 *
 * Returning `null` for a non-positive or non-finite benchmark is the whole
 * point of this helper. The catalog stores requirements as `NOT NULL`
 * numbers, so a university that simply doesn't state an SAT or IELTS bar is
 * recorded as `0`. Dividing by that used to yield `Infinity` (capped to a
 * perfect 115 — a top mark for clearing a bar that doesn't exist) or, when
 * the student's own value was also 0, `NaN` — which then spread through
 * every sum it touched and surfaced as "NaN%". A criterion with no stated
 * bar is not scored at all, exactly like one the student left blank.
 */
function ratioSignal(value: number | null, benchmark: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (!Number.isFinite(benchmark) || benchmark <= 0) return null;
  return clamp01(value / benchmark) * 100;
}

export function isAcademicCriterion(
  criterion: CriterionKey
): criterion is AcademicCriterionKey {
  return (ACADEMIC_CRITERIA as readonly string[]).includes(criterion);
}

/** A student's own result for one academic criterion — `null` when they
 * haven't entered it. Exported because the what-if simulator has to read and
 * write the same six fields the engine scores. */
export function academicValue(
  criterion: AcademicCriterionKey,
  profile: StudentProfileInput
): number | null {
  switch (criterion) {
    case "gpa":
      return profile.gpa;
    case "sat":
      return profile.satScore;
    case "act":
      return profile.actScore;
    case "ielts":
      return profile.ieltsScore;
    case "toefl":
      return profile.toeflScore;
    case "ent":
      return profile.entScore;
    default:
      return null;
  }
}

/** Writes one academic field, returning a new profile — the engine never
 * mutates the student's own profile object. */
export function withAcademicValue(
  criterion: AcademicCriterionKey,
  value: number | null,
  profile: StudentProfileInput
): StudentProfileInput {
  const field = {
    gpa: "gpa",
    sat: "satScore",
    act: "actScore",
    ielts: "ieltsScore",
    toefl: "toeflScore",
    ent: "entScore",
  }[criterion] as keyof StudentProfileInput;

  return { ...profile, [field]: value };
}

/** The fit signal for a single criterion, or `null` when it can't be scored
 * — the student left it blank, or no bar exists to measure it against.
 *
 * Every academic bar comes from `lib/benchmarks.ts` rather than being
 * decided here, so the number the engine divides by is provably the same one
 * the requirements-gap card shows the student. */
function computeSignal(
  criterion: CriterionKey,
  university: University,
  profile: StudentProfileInput
): number | null {
  if (!isAcademicCriterion(criterion)) {
    return profile.achievements[criterion as AchievementCriterionKey] ? 100 : 0;
  }

  const benchmark = academicBenchmark(criterion, university);
  if (!benchmark) return null;

  return ratioSignal(academicValue(criterion, profile), benchmark.value);
}

/**
 * Weighted mean of whichever criteria in `criteria` are both scorable and
 * carry weight — or `null` when none of them are.
 *
 * `null` rather than `0`: those two mean opposite things to a reader. A
 * program that weights every leadership criterion at 0 isn't telling the
 * student their leadership is worthless, it's saying leadership isn't part
 * of how this program is assessed.
 *
 * The `Number.isFinite` guard is deliberate belt-and-braces on top of
 * `ratioSignal`: the previous `signal == null` test let `NaN` straight
 * through, so a single bad input poisoned the whole score.
 */
function weightedAverage(
  criteria: readonly CriterionKey[],
  signals: Partial<Record<CriterionKey, number | null>>,
  weights: CriterionWeights
): number | null {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const criterion of criteria) {
    const signal = signals[criterion];
    const weight = weights[criterion] ?? 0;
    if (signal == null || !Number.isFinite(signal)) continue;
    if (!Number.isFinite(weight) || weight <= 0) continue;
    weightedSum += signal * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : null;
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
    academicStrength: capBucket(
      weightedAverage(BREAKDOWN_GROUPS.academicStrength, signals, weights)
    ),
    activities: capBucket(weightedAverage(BREAKDOWN_GROUPS.activities, signals, weights)),
    leadership: capBucket(weightedAverage(BREAKDOWN_GROUPS.leadership, signals, weights)),
    achievements: capBucket(weightedAverage(BREAKDOWN_GROUPS.achievements, signals, weights)),
  };
}

/**
 * Holds a displayed component to 0-100.
 *
 * Individual signals are allowed up to 115 so that clearing a bar
 * comfortably still counts for something in the headline score (see
 * `clamp01`). That headroom must not escape into the breakdown: a student
 * with a 4.0 GPA looking at a university whose stated minimum is 3.4 was
 * shown "Academic strength 115%", which is neither true nor meaningful. The
 * bonus keeps working inside `predictMatch`; only the reported figure is
 * capped.
 */
function capBucket(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return clamp(value, 0, 100);
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

  // `null` here means nothing about this student could be scored at all
  // (empty profile, or a program that weights everything at 0). The floor of
  // the final clamp then reports the minimum rather than a bare 0.
  const raw = weightedAverage(ALL_CRITERIA, signals, weights) ?? 0;

  // Guarded because it is division-adjacent arithmetic on catalog data: an
  // acceptance rate outside 0-100 (bad import, hand-edited row) would
  // otherwise invert the penalty and inflate the score above everything the
  // model intends.
  const acceptanceRate = Number.isFinite(university.acceptanceRate)
    ? clamp(university.acceptanceRate, 0, 100)
    : 0;

  const selectivityPenalty = (100 - acceptanceRate) / 100;
  const adjusted = raw * (0.55 + 0.45 * (acceptanceRate / 100)) - selectivityPenalty * 8;

  // Deliberately [2, 98], not [0, 100]: this is an estimate, and the product
  // does not claim certainty in either direction (see the disclaimer shown
  // alongside every score).
  const score = Math.round(clamp(adjusted, SCORE_FLOOR, SCORE_CEILING));

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
