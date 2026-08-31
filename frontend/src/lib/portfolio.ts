/**
 * The application portfolio: not "how do I score at this one university",
 * but "given everywhere I'm applying, am I getting in somewhere?"
 *
 * This is the question a student is actually asking, and no single-university
 * score can answer it. A list of eight reaches and a list of two reaches plus
 * a safety are wildly different applications, and the per-university screens
 * make them look the same.
 *
 * Scoring uses the same engine and the same per-programme weights as every
 * other screen (see `lib/weights-server.ts`), so a university's fit here can
 * never disagree with its fit on its own page.
 */

import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import { predictMatch, type CriterionWeights, type StudentProfileInput } from "@/lib/predict";
import {
  admissionProbability,
  atLeastOneAdmission,
  type PortfolioOdds,
  type ProbabilityEstimate,
} from "@/lib/probability";
import type { MatchCategory, University } from "@/types/domain";

export interface PortfolioEntry {
  university: University;
  fitScore: number;
  category: MatchCategory;
  probability: ProbabilityEstimate;
}

export interface PortfolioBalance {
  safe: number;
  target: number;
  reach: number;
}

export interface Portfolio {
  entries: PortfolioEntry[];
  balance: PortfolioBalance;
  odds: PortfolioOdds;
  /** Structural problems with the *shape* of the list, not with the student.
   * Empty when the portfolio is balanced. */
  warnings: string[];
}

/** Scores one university for one student. */
export function scoreUniversity(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights,
  confidence: number
): PortfolioEntry {
  const { score, category } = predictMatch(university, profile, weights);

  return {
    university,
    fitScore: score,
    category,
    probability: admissionProbability(score, university.acceptanceRate, confidence),
  };
}

/**
 * Builds the portfolio for a shortlist.
 *
 * @param weightsByUniversity Per-university programme weights, for the
 *   universities that offer the student's declared field. Anything missing
 *   falls back to the platform default — the same rule every other screen
 *   applies.
 * @param confidence Profile completeness, 0-100. Widens the probability
 *   bands rather than moving them.
 */
export function buildPortfolio(
  shortlist: University[],
  profile: StudentProfileInput,
  weightsByUniversity: Record<string, CriterionWeights>,
  confidence: number
): Portfolio {
  const entries = shortlist
    .map((university) =>
      scoreUniversity(
        university,
        profile,
        weightsByUniversity[university.id] ?? DEFAULT_WEIGHTS,
        confidence
      )
    )
    .sort((a, b) => b.probability.p - a.probability.p);

  const balance: PortfolioBalance = {
    safe: entries.filter((entry) => entry.category === "safe").length,
    target: entries.filter((entry) => entry.category === "target").length,
    reach: entries.filter((entry) => entry.category === "reach").length,
  };

  return {
    entries,
    balance,
    odds: atLeastOneAdmission(entries.map((entry) => entry.probability.p)),
    warnings: warningsFor(entries, balance),
  };
}

function warningsFor(entries: PortfolioEntry[], balance: PortfolioBalance): string[] {
  const warnings: string[] = [];

  if (entries.length === 0) return warnings;

  if (balance.safe === 0) {
    warnings.push(
      "No safety school. Every application on this list is one you could plausibly be turned down by — one safe choice changes the shape of the whole outcome."
    );
  }

  if (entries.length < 5) {
    warnings.push(
      `Only ${entries.length} application${entries.length === 1 ? "" : "s"}. A thin list makes the combined odds fragile: one unlucky decision is a large share of it.`
    );
  }

  if (balance.reach > 0 && balance.reach === entries.length) {
    warnings.push(
      "Every school here is a reach. That can be a deliberate choice, but it should be a deliberate one."
    );
  }

  if (balance.target === 0 && entries.length >= 3) {
    warnings.push(
      "No target schools — the list jumps straight from safeties to reaches, and targets are where most admissions actually happen."
    );
  }

  return warnings;
}

/**
 * A balanced starting shortlist, for a student who hasn't saved anything yet.
 *
 * Picks the strongest chances in each band rather than simply the top N by
 * probability, which would hand back eight safeties and call it a strategy.
 */
export function suggestShortlist(
  universities: University[],
  profile: StudentProfileInput,
  weightsByUniversity: Record<string, CriterionWeights>,
  confidence: number,
  quota: PortfolioBalance = { safe: 2, target: 4, reach: 2 }
): University[] {
  const scored = universities
    .map((university) =>
      scoreUniversity(
        university,
        profile,
        weightsByUniversity[university.id] ?? DEFAULT_WEIGHTS,
        confidence
      )
    )
    .sort((a, b) => b.probability.p - a.probability.p);

  const take = (category: MatchCategory, count: number) =>
    scored.filter((entry) => entry.category === category).slice(0, count);

  return [
    ...take("safe", quota.safe),
    ...take("target", quota.target),
    // The most competitive reaches, not the most attainable: a reach chosen
    // for being nearly safe is just a target with a longer commute.
    ...scored
      .filter((entry) => entry.category === "reach")
      .slice(-quota.reach)
      .reverse(),
  ].map((entry) => entry.university);
}
