import { describe, expect, it } from "vitest";

import { ACT_COMPETITIVE_BASELINE, DEFAULT_WEIGHTS } from "@/lib/criteria";
import { academicBenchmark } from "@/lib/benchmarks";
import { predictMatch, type StudentProfileInput } from "@/lib/predict";
import { admissionProbability, atLeastOneAdmission } from "@/lib/probability";
import { planToTarget, simulateLevers } from "@/lib/what-if";
import type { University } from "@/types/domain";

/** Same shape as the fixture in predict.test.ts — a catalog row with real
 * stated bars, including the ACT range that used to be ignored. */
function university(overrides: Partial<University> = {}): University {
  return {
    id: "uni-test",
    slug: "test",
    name: "Test University",
    shortName: "Test",
    country: "Kazakhstan",
    city: "Astana",
    logoInitials: "TU",
    worldRanking: 300,
    nationalRanking: 1,
    acceptanceRate: 12,
    selectivityLevel: "Highly Selective",
    tuitionPerYearUsd: 0,
    livingCostPerYearUsd: 5000,
    scholarshipAvailable: true,
    scholarshipCoverage: "Full",
    applicationDeadline: "January 15",
    decisionType: "Regular Decision",
    tags: [],
    description: "",
    minGpa: 3.4,
    satLow: 1300,
    satHigh: 1500,
    actMin: 28,
    actMax: 34,
    ieltsMin: 6.0,
    toeflMin: 80,
    requirements: [],
    acceptRateTrend: [],
    gradientFrom: "#000",
    gradientTo: "#111",
    website: "https://example.edu",
    ...overrides,
  };
}

function profile(overrides: Partial<StudentProfileInput> = {}): StudentProfileInput {
  return {
    gpa: null,
    satScore: null,
    actScore: null,
    ieltsScore: null,
    toeflScore: null,
    entScore: null,
    achievements: {},
    ...overrides,
  };
}

describe("academicBenchmark", () => {
  it("measures ACT against the university's own range when it states one", () => {
    const benchmark = academicBenchmark("act", university({ actMin: 28, actMax: 34 }));

    expect(benchmark?.value).toBe(31);
    expect(benchmark?.source).toBe("university");
  });

  it("falls back to the national baseline only when no range is stated", () => {
    const benchmark = academicBenchmark("act", university({ actMin: null, actMax: null }));

    expect(benchmark?.value).toBe(ACT_COMPETITIVE_BASELINE);
    expect(benchmark?.source).toBe("national");
  });

  it("returns null for a bar the catalog stores as unstated, so it is not scored", () => {
    expect(academicBenchmark("toefl", university({ toeflMin: 0 }))).toBeNull();
  });
});

describe("simulateLevers", () => {
  it("only proposes actions that actually raise the score", () => {
    const levers = simulateLevers(
      university(),
      profile({ gpa: 3.0, ieltsScore: 6.0 }),
      DEFAULT_WEIGHTS
    );

    expect(levers.length).toBeGreaterThan(0);
    for (const lever of levers) {
      expect(lever.delta).toBeGreaterThan(0);
    }
  });

  it("reports a delta the engine reproduces when the action is taken", () => {
    const student = profile({ gpa: 3.0, ieltsScore: 6.0 });
    const baseline = predictMatch(university(), student, DEFAULT_WEIGHTS).score;
    const [best] = simulateLevers(university(), student, DEFAULT_WEIGHTS);

    // The whole point of computing suggestions with the real engine: applying
    // one has to land on exactly the score that was promised.
    const after = predictMatch(university(), best.profile, DEFAULT_WEIGHTS).score;
    expect(after).toBe(baseline + best.delta);
  });

  it("never suggests a criterion the programme weights at zero", () => {
    const levers = simulateLevers(
      university(),
      profile({ gpa: 3.0 }),
      { gpa: 10, ielts: 5 } // olympiads and everything else: unweighted
    );

    expect(levers.some((lever) => lever.criterion === "olympiads")).toBe(false);
  });

  it("does not suggest an achievement the student already has", () => {
    const levers = simulateLevers(
      university(),
      profile({ gpa: 3.0, achievements: { olympiads: true } }),
      DEFAULT_WEIGHTS
    );

    expect(levers.some((lever) => lever.criterion === "olympiads")).toBe(false);
  });

  it("offers sitting a test the student has no score for", () => {
    const levers = simulateLevers(university(), profile({ gpa: 3.0 }), DEFAULT_WEIGHTS);

    expect(levers.some((lever) => lever.id === "sit-ielts")).toBe(true);
  });
});

describe("planToTarget", () => {
  it("reaches the target and reports the score the steps really produce", () => {
    const student = profile({ gpa: 3.2, ieltsScore: 6.0 });
    const plan = planToTarget(university(), student, DEFAULT_WEIGHTS, 60);

    if (plan.reached) {
      expect(plan.to).toBeGreaterThanOrEqual(60);
      // Deltas do not simply add up — the engine renormalises — so the plan's
      // final score must come from re-running it, which is what this asserts.
      const last = plan.steps.at(-1);
      expect(predictMatch(university(), last!.profile, DEFAULT_WEIGHTS).score).toBe(plan.to);
    }
  });

  it("says so rather than inventing steps when a target is out of reach", () => {
    const plan = planToTarget(
      university({ acceptanceRate: 3 }),
      profile({ gpa: 2.0 }),
      DEFAULT_WEIGHTS,
      98
    );

    expect(plan.reached).toBe(false);
    expect(plan.to).toBeLessThan(98);
  });

  it("never returns more steps than the cap", () => {
    const plan = planToTarget(
      university(),
      profile({ gpa: 2.5 }),
      DEFAULT_WEIGHTS,
      98,
      { maxSteps: 3 }
    );

    expect(plan.steps.length).toBeLessThanOrEqual(3);
  });
});

describe("admissionProbability", () => {
  it("keeps a strong profile at a very selective school well below certainty", () => {
    const { p } = admissionProbability(95, 4, 100);

    expect(p).toBeLessThan(0.5);
    expect(p).toBeGreaterThan(0.04 / 100);
  });

  it("moves with fit in the right direction", () => {
    const weak = admissionProbability(30, 40).p;
    const strong = admissionProbability(80, 40).p;

    expect(strong).toBeGreaterThan(weak);
  });

  it("widens the band for a thinner profile without moving the estimate", () => {
    const thin = admissionProbability(70, 40, 20);
    const full = admissionProbability(70, 40, 100);

    expect(thin.p).toBeCloseTo(full.p, 10);
    expect(thin.high - thin.low).toBeGreaterThan(full.high - full.low);
  });

  it("survives an acceptance rate of 0 in the catalog", () => {
    const { p } = admissionProbability(70, 0);

    expect(Number.isFinite(p)).toBe(true);
    expect(p).toBeGreaterThan(0);
  });

  it("is never reported as calibrated before outcomes exist", () => {
    expect(admissionProbability(70, 40).isCalibrated).toBe(false);
  });
});

describe("atLeastOneAdmission", () => {
  it("brackets the combined odds between the best single chance and independence", () => {
    const odds = atLeastOneAdmission([0.3, 0.2, 0.5]);

    expect(odds.correlated).toBe(0.5);
    expect(odds.independent).toBeCloseTo(1 - 0.7 * 0.8 * 0.5, 10);
    expect(odds.independent).toBeGreaterThan(odds.correlated);
  });

  it("returns zeroes for an empty portfolio rather than NaN", () => {
    expect(atLeastOneAdmission([])).toEqual({ independent: 0, correlated: 0, count: 0 });
  });
});
