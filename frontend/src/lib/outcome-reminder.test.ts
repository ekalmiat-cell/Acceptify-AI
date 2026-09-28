import { describe, expect, it } from "vitest";

import { pendingOutcomes } from "@/lib/outcome-reminder";
import type { PredictionHistoryEntry } from "@/types/domain";

const NOW = new Date("2026-06-01T12:00:00Z");

function entry(id: string, universityId: string, createdAt: string, outcome: PredictionHistoryEntry["outcome"] = null): PredictionHistoryEntry {
  return {
    id,
    universityId,
    matchScore: 60,
    category: "target",
    createdAt,
    status: "Analyzed",
    outcome,
    outcomeReportedAt: outcome ? createdAt : null,
  };
}

describe("pendingOutcomes", () => {
  it("skips predictions too recent to have a decision", () => {
    expect(pendingOutcomes([entry("a", "u1", "2026-05-25T00:00:00Z")], NOW)).toEqual([]);
    expect(pendingOutcomes([entry("a", "u1", "2026-04-01T00:00:00Z")], NOW).map((p) => p.id)).toEqual(["a"]);
  });

  it("asks once per university, using its latest prediction", () => {
    const result = pendingOutcomes(
      [entry("old", "u1", "2026-02-01T00:00:00Z"), entry("new", "u1", "2026-03-01T00:00:00Z")],
      NOW,
    );
    expect(result.map((p) => p.id)).toEqual(["new"]);
  });

  it("leaves out universities that already have an outcome", () => {
    const result = pendingOutcomes(
      [entry("a", "u1", "2026-02-01T00:00:00Z", "admitted"), entry("b", "u1", "2026-03-01T00:00:00Z"), entry("c", "u2", "2026-03-01T00:00:00Z")],
      NOW,
    );
    expect(result.map((p) => p.id)).toEqual(["c"]);
  });

  it("caps the list", () => {
    const many = Array.from({ length: 9 }, (_, i) => entry(`p${i}`, `u${i}`, `2026-03-0${i + 1}T00:00:00Z`));
    expect(pendingOutcomes(many, NOW)).toHaveLength(4);
  });
});
