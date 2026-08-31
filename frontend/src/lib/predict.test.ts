import { describe, expect, it } from "vitest";

import {
  SCORE_CEILING,
  SCORE_FLOOR,
  computeScoreBreakdown,
  predictMatch,
  type StudentProfileInput,
} from "@/lib/predict";
import { ALL_CRITERIA, DEFAULT_WEIGHTS, type CriterionKey } from "@/lib/criteria";
import type { University } from "@/types/domain";

/**
 * A university with the shape of a real catalog row. Values mirror
 * Nazarbayev University from backend/scripts/seed_universities.py, because
 * its comparatively low stated bars (GPA 3.4, IELTS 6.0, TOEFL 80) are what
 * made the "115%" breakdown bug reachable with an ordinary strong profile.
 */
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

/** Every achievement criterion marked as achieved. */
const allAchievements = Object.fromEntries(
  ALL_CRITERIA.map((key) => [key, true])
) as StudentProfileInput["achievements"];

describe("predictMatch — score bounds", () => {
  it("reports the floor, not 0 or NaN, for a completely empty profile", () => {
    const { score } = predictMatch(university(), profile());

    expect(score).toBe(SCORE_FLOOR);
    expect(Number.isFinite(score)).toBe(true);
  });

  it("reports the ceiling for a maximal profile at an unselective university", () => {
    const { score } = predictMatch(
      university({ acceptanceRate: 100 }),
      profile({
        gpa: 4.0,
        satScore: 1600,
        actScore: 36,
        ieltsScore: 9,
        toeflScore: 120,
        entScore: 140,
        achievements: allAchievements,
      })
    );

    expect(score).toBe(SCORE_CEILING);
  });

  it("never leaves [floor, ceiling] across a sweep of inputs", () => {
    const gpas = [-5, 0, 2, 3.4, 4, 100];
    const sats = [0, 400, 1600, 9999];
    const rates = [0, 4, 50, 100];

    for (const gpa of gpas) {
      for (const satScore of sats) {
        for (const acceptanceRate of rates) {
          const { score } = predictMatch(
            university({ acceptanceRate }),
            profile({ gpa, satScore })
          );

          expect(Number.isFinite(score)).toBe(true);
          expect(score).toBeGreaterThanOrEqual(SCORE_FLOOR);
          expect(score).toBeLessThanOrEqual(SCORE_CEILING);
        }
      }
    }
  });

  it("survives a university row with an out-of-range acceptance rate", () => {
    for (const acceptanceRate of [-30, 250, Number.NaN]) {
      const { score } = predictMatch(
        university({ acceptanceRate }),
        profile({ gpa: 3.8, satScore: 1450 })
      );

      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeLessThanOrEqual(SCORE_CEILING);
    }
  });
});

describe("computeScoreBreakdown — the reported components", () => {
  it("caps a component at 100 where the profile clears the bar outright", () => {
    // GPA 4.0 / 3.4, IELTS 7.5 / 6.0 and TOEFL 110 / 80 each exceed the
    // stated bar by more than the 15% headroom the engine allows, which is
    // what used to surface as "Academic strength 115%".
    const breakdown = computeScoreBreakdown(
      university(),
      profile({ gpa: 4.0, ieltsScore: 7.5, toeflScore: 110 })
    );

    expect(breakdown.academicStrength).not.toBeNull();
    expect(breakdown.academicStrength!).toBeLessThanOrEqual(100);
    expect(breakdown.academicStrength!).toBeGreaterThan(95);
  });

  it("returns null — not 0 — for a component the program does not weight", () => {
    const noLeadership: Partial<Record<CriterionKey, number>> = { ...DEFAULT_WEIGHTS };
    for (const key of ["leadership", "mun", "debate", "communityService"] as const) {
      noLeadership[key] = 0;
    }

    const breakdown = computeScoreBreakdown(
      university(),
      profile({ gpa: 3.8, achievements: allAchievements }),
      noLeadership
    );

    expect(breakdown.leadership).toBeNull();
    expect(breakdown.achievements).not.toBeNull();
  });

  it("returns null for a component the student has provided nothing for", () => {
    const breakdown = computeScoreBreakdown(university(), profile({ gpa: 3.8 }));

    // Academic is scorable (a GPA is present); the achievement-driven
    // components are all false, which is a real zero, not an absence.
    expect(breakdown.academicStrength).not.toBeNull();
    expect(breakdown.activities).toBe(0);
  });
});

describe("unstated requirements", () => {
  const unstated = university({ minGpa: 0, ieltsMin: 0, toeflMin: 0, satLow: 0, satHigh: 0 });

  it("does not score a requirement the university never stated", () => {
    const breakdown = computeScoreBreakdown(
      unstated,
      profile({ gpa: 3.8, ieltsScore: 7.0, toeflScore: 100, satScore: 1400 })
    );

    // Nothing academic is comparable, so the component is absent rather than
    // a perfect score for clearing a bar that does not exist.
    expect(breakdown.academicStrength).toBeNull();
  });

  it("produces a finite score when the student's value is also zero", () => {
    // 0 / 0 used to yield NaN, which then spread through every sum it
    // touched and reached the UI as "NaN%".
    const { score } = predictMatch(unstated, profile({ gpa: 0, satScore: 0, ieltsScore: 0 }));

    expect(Number.isNaN(score)).toBe(false);
    expect(Number.isFinite(score)).toBe(true);
  });

  it("does not award a perfect signal for an unstated bar", () => {
    // Weighted on GPA alone: with the default weights the twenty
    // not-yet-achieved achievements drag both variants down to the floor,
    // which would hide the difference this test exists to catch.
    const gpaOnly: Partial<Record<CriterionKey, number>> = { gpa: 10 };
    const student = profile({ gpa: 3.4 });

    const withBar = predictMatch(university(), student, gpaOnly);
    const withoutBar = predictMatch(university({ minGpa: 0 }), student, gpaOnly);

    // Meeting a stated bar must score better than a bar that does not exist:
    // dividing by zero previously turned the missing bar into a perfect mark.
    expect(withBar.score).toBeGreaterThan(withoutBar.score);
    expect(withoutBar.score).toBe(SCORE_FLOOR);
  });
});

describe("program weights", () => {
  it("produces a different score under different program weights", () => {
    const academicOnly: Partial<Record<CriterionKey, number>> = { gpa: 10, sat: 10 };
    const achievementsOnly: Partial<Record<CriterionKey, number>> = { olympiads: 10, research: 10 };

    const student = profile({
      gpa: 4.0,
      satScore: 1550,
      achievements: { olympiads: false, research: false },
    });

    const strongAcademics = predictMatch(university(), student, academicOnly);
    const weakAchievements = predictMatch(university(), student, achievementsOnly);

    expect(strongAcademics.score).toBeGreaterThan(weakAchievements.score);
  });

  it("is deterministic — the same inputs always give the same score", () => {
    const student = profile({ gpa: 3.7, satScore: 1420, ieltsScore: 7.5 });
    const target = university();

    const first = predictMatch(target, student, DEFAULT_WEIGHTS);
    const second = predictMatch(target, student, DEFAULT_WEIGHTS);

    expect(first).toEqual(second);
  });
});
