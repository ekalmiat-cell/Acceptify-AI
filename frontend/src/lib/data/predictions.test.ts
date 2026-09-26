import { describe, expect, it } from "vitest";

import { MIN_OUTCOMES_TO_CALIBRATE, summarizeOutcomes } from "@/lib/data/predictions";
import { CALIBRATION_TARGET_OUTCOMES } from "@/lib/probability";

describe("summarizeOutcomes", () => {
  it("is empty and uncalibrated with no reports", () => {
    const summary = summarizeOutcomes([]);

    expect(summary.reported).toBe(0);
    expect(summary.meanScoreAdmitted).toBeNull();
    expect(summary.bands.every((band) => band.reported === 0)).toBe(true);
    expect(summary.isCalibrated).toBe(false);
  });

  it("counts outcomes, averages scores and buckets them into bands", () => {
    const summary = summarizeOutcomes([
      { matchScore: 90, outcome: "admitted" },
      { matchScore: 75, outcome: "admitted" },
      { matchScore: 30, outcome: "rejected" },
      { matchScore: 72, outcome: "waitlisted" },
    ]);

    expect(summary).toMatchObject({
      reported: 4,
      admitted: 2,
      rejected: 1,
      waitlisted: 1,
      withdrawn: 0,
      meanScoreAdmitted: 82.5,
      meanScoreRejected: 30,
    });

    const safe = summary.bands.find((band) => band.label.startsWith("Safe"));
    // The waitlist is reported in its band but is not counted as an admission.
    expect(safe).toMatchObject({ reported: 2, admitted: 1 });
  });

  it("only calls the model calibrated at the declared threshold", () => {
    const rows = Array.from({ length: MIN_OUTCOMES_TO_CALIBRATE }, () => ({
      matchScore: 50,
      outcome: "rejected" as const,
    }));

    expect(summarizeOutcomes(rows.slice(1)).isCalibrated).toBe(false);
    expect(summarizeOutcomes(rows).isCalibrated).toBe(true);
  });

  it("agrees with the threshold the methodology page shows", () => {
    expect(CALIBRATION_TARGET_OUTCOMES).toBe(MIN_OUTCOMES_TO_CALIBRATE);
  });
});
