import { describe, expect, it } from "vitest";

import { buildEstimate, chanceCacheKey, chanceFacts, mathEstimate } from "@/lib/ai/chance";
import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import { mathReference } from "@/lib/chance-calibration";
import type { StudentProfileInput } from "@/lib/predict";
import type { ResolvedAchievement, University } from "@/types/domain";

const university = {
  id: "mit",
  name: "MIT",
  country: "United States",
  acceptanceRate: 4,
  selectivityLevel: "Most selective",
  acceptRateTrend: [
    { year: "2022", rate: 4 },
    { year: "2023", rate: 4 },
    { year: "2024", rate: 4 },
    { year: "2025", rate: 4 },
  ],
  satLow: 1520,
  satHigh: 1580,
  actMin: 34,
  actMax: 36,
  minGpa: null,
  ieltsMin: 7,
  toeflMin: null,
  decisionType: "Regular Decision",
} as unknown as University;

const profile: StudentProfileInput = {
  gpa: 3.9,
  satScore: 1560,
  actScore: null,
  ieltsScore: 7.5,
  toeflScore: null,
  entScore: 135,
  achievements: { olympiads: true },
};

function inputFor(overrides: Partial<{ profile: StudentProfileInput; locale: "en" | "ru" }> = {}) {
  const p = overrides.profile ?? profile;
  return {
    university,
    programName: "Computer Science",
    profile: p,
    achievements: ([
      { id: "olympiads", label: "Olympiads", group: "Competitions", icon: "", description: "", achieved: true, value: "IOI silver", level: "international", progress: 100 },
      { id: "ap", label: "AP Courses", group: "Credentials", icon: "", description: "", achieved: false, value: null, level: null, progress: 0 },
    ] as unknown) as ResolvedAchievement[],
    weights: DEFAULT_WEIGHTS,
    isDream: true,
    reference: mathReference(university, p, DEFAULT_WEIGHTS, 50),
    locale: overrides.locale ?? ("en" as const),
  };
}

describe("chanceFacts", () => {
  it("lists only achieved items, treats a zero rate as unknown, and keeps the model's data minimal", () => {
    const facts = chanceFacts({ ...inputFor(), university: { ...university, acceptanceRate: 0 } as University });
    expect(facts.student.achievements).toEqual([{ name: "Olympiads", detail: "IOI silver", level: "international" }]);
    expect(facts.university.acceptance_rate_percent).toBeNull();
    expect(facts.university.recent_acceptance_rates).toHaveLength(3);
    expect(JSON.stringify(facts)).not.toMatch(/email|user/i);
  });
});

describe("chanceCacheKey", () => {
  it("is the same for the same question and different when any fact changes", () => {
    const key = chanceCacheKey(inputFor());
    expect(chanceCacheKey(inputFor())).toBe(key);
    expect(chanceCacheKey(inputFor({ profile: { ...profile, satScore: 1500 } }))).not.toBe(key);
    expect(chanceCacheKey(inputFor({ locale: "ru" }))).not.toBe(key);
  });
});

describe("buildEstimate", () => {
  const reply = {
    probability_percent: 60,
    confidence: "high" as const,
    positives: ["SAT 1560 is inside the 1520-1580 range", "  "],
    negatives: ["x".repeat(500)],
    summary: "Realistic only as a reach.",
  };

  it("never lets a 4% school read as 60%, and labels it a reach", () => {
    const estimate = buildEstimate(reply, inputFor());
    expect(estimate.probability).toBeLessThanOrEqual(20);
    expect(estimate.category).toBe("reach");
    expect(estimate.adjusted).toBe(true);
    expect(estimate.source).toBe("ai");
  });

  it("drops empty reasons, trims long ones and caps confidence by what the profile holds", () => {
    const estimate = buildEstimate(reply, inputFor({ profile: { ...profile, gpa: null, satScore: null, ieltsScore: null } }));
    expect(estimate.positives).toEqual(["SAT 1560 is inside the 1520-1580 range"]);
    expect(estimate.negatives[0].length).toBeLessThanOrEqual(220);
    expect(estimate.confidence).toBe("low");
  });

  it("keeps a believable answer as it is", () => {
    const estimate = buildEstimate({ ...reply, probability_percent: 9 }, inputFor());
    expect(estimate.probability).toBe(9);
    expect(estimate.adjusted).toBe(false);
  });
});

describe("mathEstimate", () => {
  it("is the formula's chance, inside the same fences, with its reasons", () => {
    const estimate = mathEstimate(inputFor(), 50);
    expect(estimate.source).toBe("math");
    expect(estimate.probability).toBeGreaterThanOrEqual(1);
    expect(estimate.probability).toBeLessThanOrEqual(20);
    expect(estimate.category).toBe("reach");
    expect(estimate.positives.length + estimate.negatives.length).toBeGreaterThan(0);
  });
});
