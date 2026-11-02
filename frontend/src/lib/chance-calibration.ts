import { admissionProbability } from "@/lib/probability";
import { predictMatch, type CriterionWeights, type StudentProfileInput } from "@/lib/predict";
import type { ChanceConfidence } from "@/types/chance";
import type { CatalogUniversity, MatchCategory } from "@/types/domain";

/**
 * What stands between the model's number and the student: limits the model
 * does not get to argue with. A language model is good at reading a profile
 * and weighing it, and bad at remembering that most people are rejected, so
 * its answer is only used inside two fences:
 *
 * - hard bounds from the university's acceptance rate, which nobody clears
 *   ("a 4% school is never 60%"), and
 * - a loose window around the plain formula (`lib/probability.ts`), a net
 *   against answers that are nonsense in the other direction.
 *
 * The window is loose on purpose. The formula measures a profile against the
 * published bars and averages in every achievement the student has not got,
 * so it squeezes everyone toward the middle at open schools (an applicant far
 * above the bars at a 60% school comes out near 30%) and toward 1% at the
 * most selective ones (a flawless MIT applicant comes out at 1%). It is
 * useful to catch a wild answer and to answer when the model cannot, not to
 * decide the number — which is why the model is never shown it.
 *
 * The same fences decide the category, so the badge always agrees with the
 * percentage next to it.
 */

/** Bump when the prompt or these rules change, so cached answers are redone. */
export const CHANCE_VERSION = 1;

export interface ChanceBounds {
  min: number;
  max: number;
  /** False when the catalog has no usable acceptance rate for this school. */
  known: boolean;
}

const ABSOLUTE_MIN = 1;
const ABSOLUTE_MAX = 97;

function usableRate(acceptanceRate: number | null | undefined): number | null {
  if (typeof acceptanceRate !== "number" || !Number.isFinite(acceptanceRate)) return null;
  // The catalog stores a missing rate as 0, and nothing admits everyone.
  if (acceptanceRate <= 0 || acceptanceRate > 100) return null;
  return acceptanceRate;
}

/**
 * The most and least any applicant's chance can be at a school with this
 * acceptance rate (percent).
 *
 * The ceiling is the smaller of two things: a tier (a school admitting under
 * 10% is capped at 35% even before the multiplier), and a multiple of the
 * base rate — about 4.5×, which is roughly what a flawless application is
 * worth at a selective school where most of the rejected also clear every
 * bar. The floor keeps a weak but real applicant from reading as 0%.
 */
export function chanceBounds(acceptanceRate: number | null | undefined): ChanceBounds {
  const rate = usableRate(acceptanceRate);
  if (rate === null) return { min: 2, max: 85, known: false };

  const tier = rate < 10 ? 35 : rate < 20 ? 50 : rate < 35 ? 65 : rate < 55 ? 80 : rate < 75 ? 92 : ABSOLUTE_MAX;
  const multiple = Math.max(rate * 4.5, rate + 10);
  const max = Math.min(ABSOLUTE_MAX, tier, Math.round(multiple));
  const min = rate >= 70 ? 15 : Math.max(ABSOLUTE_MIN, Math.round(rate * 0.12));
  return { min: Math.min(min, max), max, known: true };
}

/**
 * Safe / target / reach for a chance. The cut points are the usual
 * counsellor's: below a quarter is a reach whoever you are, seven in ten or
 * better is safe. A school that admits under 10% is a reach for everyone —
 * the multiple above already keeps its chances under the reach line, this
 * just makes the rule explicit.
 */
export function categoryForChance(probability: number, acceptanceRate: number | null | undefined): MatchCategory {
  const rate = usableRate(acceptanceRate);
  if (rate !== null && rate < 10) return "reach";
  if (probability >= 70) return "safe";
  if (probability < 25) return "reach";
  return "target";
}

export interface MathReference {
  /** The formula's fit score, 0–100 — what the rest of the app shows. */
  fit: number;
  /** The formula's chance, whole percent, with the band it is willing to stand behind. */
  probability: number;
  low: number;
  high: number;
}

/** The formula's own answer, kept as a sanity check and as the fallback. */
export function mathReference(
  university: CatalogUniversity,
  profile: StudentProfileInput,
  weights: CriterionWeights,
  completeness: number,
): MathReference {
  const { score } = predictMatch(university, profile, weights);
  const estimate = admissionProbability(score, university.acceptanceRate, completeness);
  const percent = (p: number) => Math.min(ABSOLUTE_MAX, Math.max(ABSOLUTE_MIN, Math.round(p * 100)));
  return {
    fit: score,
    probability: percent(estimate.p),
    low: percent(estimate.low),
    high: percent(estimate.high),
  };
}

const logit = (percent: number) => {
  const p = Math.min(0.99, Math.max(0.01, percent / 100));
  return Math.log(p / (1 - p));
};
const sigmoidPercent = (x: number) => 100 / (1 + Math.exp(-x));

/** How far past the formula's own band (in log-odds, ~12x in odds) the model may go. */
const WINDOW_SLACK = 2.5;

export interface Calibrated {
  probability: number;
  /** True when the model's number was moved by at least a point. */
  adjusted: boolean;
}

/**
 * Brings a model's percentage inside the fences. A missing or non-numeric
 * answer becomes the formula's.
 */
export function calibrateChance(
  modelPercent: unknown,
  reference: MathReference,
  acceptanceRate: number | null | undefined,
): Calibrated {
  const asked = typeof modelPercent === "number" && Number.isFinite(modelPercent) ? modelPercent : reference.probability;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Soft fence first, the hard one last: where they disagree, the hard one wins.
  const windowLow = sigmoidPercent(logit(reference.low) - WINDOW_SLACK);
  const windowHigh = sigmoidPercent(logit(reference.high) + WINDOW_SLACK);
  const bounds = chanceBounds(acceptanceRate);

  let value = clamp(asked, windowLow, windowHigh);
  value = clamp(value, bounds.min, bounds.max);
  const probability = clamp(Math.round(value), ABSOLUTE_MIN, ABSOLUTE_MAX);
  return { probability, adjusted: Math.abs(probability - asked) >= 1 };
}

/** How many of the six academic numbers the student has entered. */
export function filledAcademicFields(profile: StudentProfileInput): number {
  return [profile.gpa, profile.satScore, profile.actScore, profile.ieltsScore, profile.toeflScore, profile.entScore].filter(
    (value) => value != null,
  ).length;
}

/**
 * The model's own confidence, capped by what it was given: two numbers do
 * not support a confident answer, however sure the model sounds.
 */
export function capConfidence(
  claimed: ChanceConfidence,
  profile: StudentProfileInput,
  acceptanceRate: number | null | undefined,
): ChanceConfidence {
  const filled = filledAcademicFields(profile);
  const known = usableRate(acceptanceRate) !== null;
  const ceiling: ChanceConfidence = !known || filled < 2 ? "low" : filled < 4 ? "medium" : "high";
  const rank = { low: 0, medium: 1, high: 2 } as const;
  return rank[claimed] <= rank[ceiling] ? claimed : ceiling;
}
