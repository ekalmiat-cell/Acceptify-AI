/**
 * The bar each academic criterion is measured against, resolved in one
 * place so every screen compares a student to the same number.
 *
 * Two things go wrong when this logic is duplicated. The scoring engine and
 * the "requirements gap" card each used to decide for themselves what a
 * student's ACT was being compared to, so a student could clear the bar on
 * one card while the engine scored them against a different one. And ACT was
 * always compared to a single global constant even though the catalog
 * carries `actMin`/`actMax` per university — a 30 read as below par at a
 * university that states a 26-31 range.
 *
 * A benchmark also reports *where it came from*. "You're below Harvard's
 * stated minimum" and "you're below a generally-competitive score" are
 * different claims, and the UI is expected to say which one it is making.
 */

import {
  ACT_COMPETITIVE_BASELINE,
  ENT_COMPETITIVE_BASELINE,
  type AcademicCriterionKey,
} from "@/lib/criteria";
import type { University } from "@/types/domain";

export type BenchmarkSource =
  /** The university publishes this bar itself. */
  | "university"
  /** No university states one, so a national//generally-competitive level
   * stands in — true of ENT everywhere, and of ACT where the catalog has no
   * range for this university. */
  | "national";

export interface AcademicBenchmark {
  /** The value a student's result is divided by to produce a fit signal. */
  value: number;
  source: BenchmarkSource;
  /** How the bar reads to a student, e.g. "1300-1400 range" — never just a
   * bare number, so the comparison stays checkable. */
  label: string;
}

/**
 * The catalog stores requirements as `NOT NULL` numbers, so a university
 * that publishes no bar for a test is stored as `0`. That is "unstated", not
 * "zero required": scoring against it would hand every student a free pass
 * on a requirement nobody set.
 */
function stated(bar: number | null | undefined): bar is number {
  return typeof bar === "number" && Number.isFinite(bar) && bar > 0;
}

/** The midpoint of a published range, or whichever end of it exists. */
function rangeMidpoint(low: number | null, high: number | null): number | null {
  if (stated(low) && stated(high)) return (low + high) / 2;
  if (stated(low)) return low;
  if (stated(high)) return high;
  return null;
}

/**
 * The bar for one academic criterion at one university, or `null` when
 * there is nothing to measure against — in which case the criterion is left
 * out of the score entirely rather than scored as a miss.
 */
export function academicBenchmark(
  criterion: AcademicCriterionKey,
  university: University
): AcademicBenchmark | null {
  switch (criterion) {
    case "gpa":
      return stated(university.minGpa)
        ? {
            value: university.minGpa,
            source: "university",
            label: `${university.minGpa.toFixed(2)} minimum`,
          }
        : null;

    case "sat": {
      const midpoint = rangeMidpoint(university.satLow, university.satHigh);
      if (midpoint == null) return null;
      const label =
        stated(university.satLow) && stated(university.satHigh)
          ? `${university.satLow}-${university.satHigh} range`
          : `${Math.round(midpoint)} stated`;
      return { value: midpoint, source: "university", label };
    }

    case "act": {
      // Preferred over the global baseline whenever the catalog has a range:
      // an ACT is only meaningful against the university actually reading it.
      const midpoint = rangeMidpoint(university.actMin, university.actMax);
      if (midpoint != null) {
        const label =
          stated(university.actMin) && stated(university.actMax)
            ? `${university.actMin}-${university.actMax} range`
            : `${Math.round(midpoint)} stated`;
        return { value: midpoint, source: "university", label };
      }
      return {
        value: ACT_COMPETITIVE_BASELINE,
        source: "national",
        label: `~${ACT_COMPETITIVE_BASELINE} competitive baseline`,
      };
    }

    case "ielts":
      return stated(university.ieltsMin)
        ? {
            value: university.ieltsMin,
            source: "university",
            label: `${university.ieltsMin.toFixed(1)} minimum`,
          }
        : null;

    case "toefl":
      return stated(university.toeflMin)
        ? {
            value: university.toeflMin,
            source: "university",
            label: `${university.toeflMin} minimum`,
          }
        : null;

    case "ent":
      // The national exam is sat once and read by every Kazakhstani
      // university, and none of them publish a per-program bar in the
      // catalog — so this is a national competitive level by nature, not a
      // stand-in for missing data.
      return {
        value: ENT_COMPETITIVE_BASELINE,
        source: "national",
        label: `~${ENT_COMPETITIVE_BASELINE} competitive baseline`,
      };

    default:
      return null;
  }
}

/** The scale maximum for each academic criterion — the ceiling a what-if
 * improvement can never exceed. */
export const ACADEMIC_SCALE_MAX: Record<AcademicCriterionKey, number> = {
  gpa: 4,
  sat: 1600,
  act: 36,
  ielts: 9,
  toefl: 120,
  ent: 140,
};
