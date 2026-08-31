/**
 * Turning a fit score into an admission probability — and combining several
 * of them into the only number a student actually cares about: "am I getting
 * in *somewhere*?"
 *
 * These are two different quantities and the app keeps them apart on purpose.
 * The fit score (`lib/predict.ts`) says how closely a profile matches what a
 * programme asks for. A probability has to also account for the base rate:
 * a perfect profile at a school admitting 4% of applicants is still not a
 * 95% shot, because most of the people it rejects also cleared its bars.
 *
 * The model here is deliberately the simplest thing that can be defended
 * out loud: start from the university's acceptance rate as prior odds, then
 * shift those odds up or down according to how far above or below the
 * midpoint the profile fits. It is a *structural* model, not a fitted one —
 * the direction and rough size of each effect are argued from first
 * principles, and no claim is made that the numbers are calibrated. They are
 * not, and `isCalibrated` says so until outcomes come back from real
 * applicants (see the prediction outcome endpoint on the backend) and the
 * span below can be fitted instead of chosen.
 */

/**
 * How much a perfect fit is allowed to move the odds, in log-odds.
 *
 * 2.2 means a profile at the top of the scale multiplies the university's
 * base odds by about e^2.2 ≈ 9, and one at the bottom divides them by the
 * same. Chosen so that a strong applicant at a 5%-acceptance school lands
 * around 30% rather than 90% — the failure mode being guarded against is a
 * student reading "you'll get into Stanford" off a well-filled profile.
 */
export const FIT_LOG_ODDS_SPAN = 2.2;

/** Acceptance rates are clamped away from 0 and 1: a rate of exactly 0 in
 * the catalog (usually missing data, not a school that admits nobody) would
 * send the log-odds to -Infinity and collapse every estimate to zero. */
const MIN_BASE_RATE = 0.005;
const MAX_BASE_RATE = 0.95;

export interface ProbabilityEstimate {
  /** Point estimate, 0-1. */
  p: number;
  /** The band around `p`, 0-1. Widens as the profile gets thinner — an
   * estimate from two filled fields deserves to look less certain than one
   * from a complete profile, and saying so is more useful than a false
   * point estimate. */
  low: number;
  high: number;
  /** False until the model is fitted against reported outcomes. Rendered,
   * not hidden: an uncalibrated estimate presented as a fact is the one
   * thing this module is trying not to be. */
  isCalibrated: boolean;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function logit(p: number): number {
  return Math.log(p / (1 - p));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The estimated probability of admission for one student at one university.
 *
 * @param fitScore     0-100 from `predictMatch`.
 * @param acceptanceRate The university's overall acceptance rate, 0-100.
 * @param confidence   0-100, how complete the profile behind the fit score
 *                     is — drives the width of the band, never the estimate.
 */
export function admissionProbability(
  fitScore: number,
  acceptanceRate: number,
  confidence = 60
): ProbabilityEstimate {
  const base = clamp(
    (Number.isFinite(acceptanceRate) ? acceptanceRate : 0) / 100,
    MIN_BASE_RATE,
    MAX_BASE_RATE
  );

  const fit = clamp(Number.isFinite(fitScore) ? fitScore : 0, 0, 100);
  const shift = ((fit - 50) / 50) * FIT_LOG_ODDS_SPAN;
  const logOdds = logit(base) + shift;

  // A thin profile is not a low-probability profile — it's an unknown one.
  // At 100% completeness the band is still ±0.55 log-odds, because the model
  // itself is unfitted and a zero-width band would be a lie about that too.
  const spread = 0.55 + 1.65 * (1 - clamp(confidence, 0, 100) / 100);

  return {
    p: sigmoid(logOdds),
    low: sigmoid(logOdds - spread),
    high: sigmoid(logOdds + spread),
    isCalibrated: false,
  };
}

export interface PortfolioOdds {
  /**
   * P(at least one admission) if every decision were independent:
   * 1 - Π(1 - pᵢ). The optimistic end of the bracket.
   */
  independent: number;
  /**
   * The same probability if the decisions were perfectly correlated — in
   * which case it collapses to the single best chance in the list, because
   * a student rejected by their most likely school would have been rejected
   * everywhere.
   *
   * Real admissions sit between the two: committees read overlapping
   * signals, so a weak essay or a thin transcript hurts at every school at
   * once. Reporting the bracket rather than the independent figure alone is
   * the honest form of this number, and it costs nothing to compute.
   */
  correlated: number;
  /** How many applications the bracket was computed over. */
  count: number;
}

export function atLeastOneAdmission(probabilities: number[]): PortfolioOdds {
  const valid = probabilities.filter((p) => Number.isFinite(p) && p > 0 && p < 1);
  if (valid.length === 0) {
    return { independent: 0, correlated: 0, count: 0 };
  }

  const independent = 1 - valid.reduce((product, p) => product * (1 - p), 1);

  return {
    independent,
    correlated: Math.max(...valid),
    count: valid.length,
  };
}

/** A probability as a percentage string, without ever printing a bare "0%"
 * or "100%" — neither is a claim this model is entitled to make. */
export function formatProbability(p: number): string {
  if (!Number.isFinite(p)) return "—";
  if (p < 0.01) return "<1%";
  if (p > 0.99) return ">99%";
  return `${Math.round(p * 100)}%`;
}

/**
 * How many reported outcomes the model needs before anything here can be
 * called calibrated. Mirrors `MIN_OUTCOMES_TO_CALIBRATE` in
 * backend/app/api/v1/endpoints/predictions.py — the backend is the authority
 * on whether the threshold is met (`isCalibrated` on the summary); this copy
 * exists only so the methodology page can show progress towards it.
 */
export const CALIBRATION_TARGET_OUTCOMES = 100;
