import { describe, expect, it } from "vitest";

import { computeOverallScore, readinessFor, type EssayFlags } from "@/lib/essay-rubric";

const allGood: EssayFlags = { answers_prompt: true, has_specific_story: true, has_reflection: true };

const uniform = (value: number) => ({
  reflection: value,
  specificity: value,
  voice: value,
  structure: value,
  prompt: value,
  language: value,
});

describe("computeOverallScore", () => {
  it("is the weighted average when nothing is capped", () => {
    expect(computeOverallScore(uniform(80), allGood, true)).toEqual({ score: 80, weighted: 80, cap: null });
  });

  it("weights reflection more than language", () => {
    const strongReflection = { ...uniform(60), reflection: 100 };
    const strongLanguage = { ...uniform(60), language: 100 };
    expect(computeOverallScore(strongReflection, allGood, true).score).toBeGreaterThan(
      computeOverallScore(strongLanguage, allGood, true).score,
    );
  });

  it("caps an essay that does not answer the question at 60", () => {
    const result = computeOverallScore(uniform(90), { ...allGood, answers_prompt: false }, true);
    expect(result.score).toBe(60);
    expect(result.weighted).toBe(90);
    expect(result.cap?.max).toBe(60);
  });

  it("ignores the question cap when there is no question", () => {
    expect(computeOverallScore(uniform(90), { ...allGood, answers_prompt: false }, false).score).toBe(90);
  });

  it("applies the lowest cap that the score exceeds", () => {
    const flags = { answers_prompt: true, has_specific_story: false, has_reflection: false };
    expect(computeOverallScore(uniform(95), flags, true).score).toBe(65);
  });

  it("does not raise a score that is already under the cap", () => {
    const result = computeOverallScore(uniform(50), { ...allGood, has_reflection: false }, true);
    expect(result).toEqual({ score: 50, weighted: 50, cap: null });
  });

  it("clamps out-of-range criterion scores", () => {
    expect(computeOverallScore(uniform(140), allGood, true).score).toBe(100);
    expect(computeOverallScore(uniform(-5), allGood, true).score).toBe(0);
  });
});

describe("readinessFor", () => {
  it("maps scores to bands", () => {
    expect(readinessFor(95).label).toBe("Ready to submit");
    expect(readinessFor(90).label).toBe("Ready to submit");
    expect(readinessFor(72).label).toBe("Solid draft");
    expect(readinessFor(10).label).toBe("Early draft");
  });
});
