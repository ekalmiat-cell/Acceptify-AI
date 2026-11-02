import { describe, expect, it } from "vitest";

import {
  calibrateChance,
  capConfidence,
  categoryForChance,
  chanceBounds,
  mathReference,
} from "@/lib/chance-calibration";
import type { StudentProfileInput } from "@/lib/predict";
import type { CatalogUniversity } from "@/types/domain";

const reference = { fit: 60, probability: 20, low: 10, high: 35 };

describe("chanceBounds", () => {
  it("never lets a very selective school read anywhere near 60%", () => {
    expect(chanceBounds(4).max).toBeLessThanOrEqual(20);
    expect(chanceBounds(7).max).toBeLessThanOrEqual(35);
    expect(chanceBounds(12).max).toBeLessThanOrEqual(50);
  });

  it("allows high chances only at open schools, and never certainty", () => {
    expect(chanceBounds(60).max).toBeGreaterThanOrEqual(85);
    expect(chanceBounds(95).max).toBeLessThanOrEqual(97);
    expect(chanceBounds(95).min).toBeGreaterThanOrEqual(15);
  });

  it("is generous but finite when the acceptance rate is missing", () => {
    for (const missing of [0, -3, 140, Number.NaN, null, undefined]) {
      expect(chanceBounds(missing)).toEqual({ min: 2, max: 85, known: false });
    }
  });

  it("always has min <= max and stays within 1-97", () => {
    for (let rate = 0.1; rate <= 100; rate += 0.7) {
      const { min, max } = chanceBounds(rate);
      expect(min).toBeGreaterThanOrEqual(1);
      expect(max).toBeLessThanOrEqual(97);
      expect(min).toBeLessThanOrEqual(max);
    }
  });
});

describe("categoryForChance", () => {
  it("calls anything under 10% acceptance a reach", () => {
    expect(categoryForChance(30, 6)).toBe("reach");
  });

  it("splits the rest at 25 and 70", () => {
    expect(categoryForChance(24, 40)).toBe("reach");
    expect(categoryForChance(25, 40)).toBe("target");
    expect(categoryForChance(69, 40)).toBe("target");
    expect(categoryForChance(70, 40)).toBe("safe");
  });
});

describe("calibrateChance", () => {
  it("pulls an overconfident model back under the hard ceiling", () => {
    const result = calibrateChance(60, { fit: 90, probability: 30, low: 15, high: 55 }, 4);
    expect(result.probability).toBeLessThanOrEqual(chanceBounds(4).max);
    expect(result.adjusted).toBe(true);
  });

  it("keeps the model's number when it is believable", () => {
    const result = calibrateChance(22, reference, 30);
    expect(result).toEqual({ probability: 22, adjusted: false });
  });

  it("stops an answer that is far beyond anything the formula allows", () => {
    // The formula says 10-35; 97 at a 90% school is allowed by the hard fence
    // but not by the (loose) window around the formula.
    const result = calibrateChance(97, reference, 90);
    expect(result.probability).toBeLessThan(90);
    expect(result.adjusted).toBe(true);
  });

  it("lets the model disagree with a formula that is plainly too low", () => {
    // The formula gives a flawless MIT applicant ~1%; the model's 15 stands.
    expect(calibrateChance(15, { fit: 13, probability: 1, low: 1, high: 3 }, 4).probability).toBe(15);
  });

  it("falls back to the formula for a missing or garbage answer", () => {
    for (const bad of [undefined, null, "lots", Number.NaN]) {
      expect(calibrateChance(bad, reference, 30).probability).toBe(reference.probability);
    }
  });

  it("never returns 0 or 100", () => {
    expect(calibrateChance(0, { fit: 2, probability: 1, low: 1, high: 3 }, 50).probability).toBeGreaterThanOrEqual(1);
    expect(calibrateChance(100, { fit: 98, probability: 97, low: 90, high: 97 }, 90).probability).toBeLessThanOrEqual(97);
  });
});

describe("capConfidence", () => {
  const profile = (filled: number): StudentProfileInput => ({
    gpa: filled > 0 ? 3.8 : null,
    satScore: filled > 1 ? 1400 : null,
    actScore: null,
    ieltsScore: filled > 2 ? 7 : null,
    toeflScore: null,
    entScore: filled > 3 ? 120 : null,
    achievements: {},
  });

  it("will not let two numbers support a confident answer", () => {
    expect(capConfidence("high", profile(1), 30)).toBe("low");
    expect(capConfidence("high", profile(3), 30)).toBe("medium");
    expect(capConfidence("high", profile(4), 30)).toBe("high");
  });

  it("is low whenever the base rate is unknown", () => {
    expect(capConfidence("high", profile(4), 0)).toBe("low");
  });

  it("never raises a modest claim", () => {
    expect(capConfidence("low", profile(4), 30)).toBe("low");
  });
});

describe("mathReference", () => {
  it("reports whole percents inside 1-97", () => {
    const university = { acceptanceRate: 4, minGpa: 3.9, satLow: 1500, satHigh: 1580 } as CatalogUniversity;
    const profile: StudentProfileInput = {
      gpa: 4,
      satScore: 1600,
      actScore: null,
      ieltsScore: null,
      toeflScore: null,
      entScore: null,
      achievements: {},
    };
    const ref = mathReference(university, profile, { gpa: 10, sat: 9 }, 60);
    for (const value of [ref.probability, ref.low, ref.high]) {
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(97);
    }
    expect(ref.low).toBeLessThanOrEqual(ref.probability);
    expect(ref.probability).toBeLessThanOrEqual(ref.high);
  });
});
