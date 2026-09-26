import { describe, expect, it } from "vitest";

import {
  academicProfileSchema,
  essayAnalyzeSchema,
  evaluationProfileSchema,
  isAchievementKey,
  predictionSchema,
} from "@/lib/validation";

describe("academicProfileSchema", () => {
  it("accepts an empty profile and fills missing fields with null", () => {
    expect(academicProfileSchema.parse({})).toEqual({
      gpa: null,
      satScore: null,
      actScore: null,
      ieltsScore: null,
      toeflScore: null,
      entScore: null,
      dreamUniversityId: null,
      dreamProgramId: null,
    });
  });

  it("rejects scores outside what the profile form allows", () => {
    expect(academicProfileSchema.safeParse({ satScore: 1700 }).success).toBe(false);
    expect(academicProfileSchema.safeParse({ ieltsScore: 9.5 }).success).toBe(false);
    expect(academicProfileSchema.safeParse({ actScore: 30.5 }).success).toBe(false);
    expect(academicProfileSchema.safeParse({ gpa: 3.85, satScore: 1520 }).success).toBe(true);
  });
});

describe("predictionSchema", () => {
  it("defaults the status and bounds the score", () => {
    expect(
      predictionSchema.parse({ universityId: "uni-mit", matchScore: 64, category: "target" }).status,
    ).toBe("Analyzed");
    expect(
      predictionSchema.safeParse({ universityId: "uni-mit", matchScore: 140, category: "safe" })
        .success,
    ).toBe(false);
  });
});

describe("evaluationProfileSchema", () => {
  it("rejects unknown criteria and duplicates", () => {
    expect(
      evaluationProfileSchema.safeParse({ weights: [{ criterionKey: "height", weight: 5 }] }).success,
    ).toBe(false);
    expect(
      evaluationProfileSchema.safeParse({
        weights: [
          { criterionKey: "gpa", weight: 5 },
          { criterionKey: "gpa", weight: 6 },
        ],
      }).success,
    ).toBe(false);
    expect(
      evaluationProfileSchema.safeParse({ weights: [{ criterionKey: "gpa", weight: 10 }] }).success,
    ).toBe(true);
  });
});

describe("essayAnalyzeSchema", () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

  it("needs at least 25 words", () => {
    expect(essayAnalyzeSchema.safeParse({ essay_text: words(24) }).success).toBe(false);
    expect(essayAnalyzeSchema.safeParse({ essay_text: words(25) }).success).toBe(true);
  });

  it("fills sensible defaults", () => {
    const parsed = essayAnalyzeSchema.parse({ essay_text: words(30), title: "  " });
    expect(parsed.title).toBe("Untitled Essay");
    expect(parsed.include_profile_context).toBe(true);
    expect(parsed.university_id).toBeNull();
  });
});

describe("isAchievementKey", () => {
  it("only accepts catalog achievements", () => {
    expect(isAchievementKey("olympiads")).toBe(true);
    expect(isAchievementKey("gpa")).toBe(false);
    expect(isAchievementKey("__proto__")).toBe(false);
  });
});
