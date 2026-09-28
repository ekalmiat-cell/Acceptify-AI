import { describe, expect, it } from "vitest";

import { liteFirst } from "@/lib/ai/gemini";
import { checkDrillAnswer } from "@/lib/training/check";
import { DRILLS, UNITS, drillsInUnit, nextDrill, orderedUnits } from "@/lib/training/drills";
import { parsePersonalDrillId, personalDrillId, personalDrills, sentenceAround } from "@/lib/training/personal";
import { currentStreak } from "@/lib/training/progress";
import type { EssayReviewV2, LineFeedback } from "@/types/essay";

describe("the course", () => {
  it("has unique drill ids and every unit has drills", () => {
    expect(new Set(DRILLS.map((d) => d.id)).size).toBe(DRILLS.length);
    for (const unit of UNITS) expect(drillsInUnit(unit.key).length).toBeGreaterThan(0);
  });

  it("gives every quick-pick drill exactly one right answer", () => {
    for (const drill of DRILLS) {
      if (drill.kind === "choose") expect(drill.options.filter((o) => o.correct)).toHaveLength(1);
    }
  });

  // The model answer is what a student is told "passes" — the rules must agree.
  it.each(DRILLS.filter((d) => d.kind === "rewrite").map((d) => [d.id, d] as const))(
    "%s: the model answer passes every check",
    (_id, drill) => {
      if (drill.kind !== "rewrite") return;
      const check = checkDrillAnswer(drill.rules, drill.model, drill.source);
      expect(check.results.filter((r) => !r.ok)).toEqual([]);
    },
  );

  it.each(DRILLS.filter((d) => d.kind === "rewrite" && d.source).map((d) => [d.id, d] as const))(
    "%s: the weak original does not pass",
    (_id, drill) => {
      if (drill.kind !== "rewrite") return;
      expect(checkDrillAnswer(drill.rules, drill.source!, drill.source).done).toBe(false);
    },
  );

  it("puts the weakest criterion's unit first", () => {
    expect(orderedUnits("reflection")[0].key).toBe("reflection");
    expect(orderedUnits(null)[0].key).toBe("hook");
    expect(orderedUnits("prompt")).toHaveLength(UNITS.length);
  });

  it("finds the next unfinished drill, wrapping to the start", () => {
    expect(nextDrill(DRILLS[0].id)?.id).toBe(DRILLS[1].id);
    expect(nextDrill(DRILLS[0].id, new Set([DRILLS[1].id]))?.id).toBe(DRILLS[2].id);
    const last = DRILLS[DRILLS.length - 1].id;
    expect(nextDrill(last)?.id).toBe(DRILLS[0].id);
    expect(nextDrill(last, new Set(DRILLS.map((d) => d.id)))).toBeNull();
  });
});

describe("checkDrillAnswer", () => {
  const show = DRILLS.find((d) => d.id === "spec-show")!;

  it("flags telling words and asks for a concrete detail", () => {
    if (show.kind !== "rewrite") throw new Error("expected a rewrite drill");
    const check = checkDrillAnswer(show.rules, "I am really dedicated to my work.", show.source);
    expect(check.done).toBe(false);
    expect(check.results.some((r) => !r.ok && r.label.includes("dedicated"))).toBe(true);
    expect(check.results.some((r) => !r.ok && r.label === "No concrete detail yet")).toBe(true);
  });

  it("does not treat 'Mr.' or 'a.m.' as the end of a sentence", () => {
    const check = checkDrillAnswer([{ type: "maxSentences", n: 1 }, { type: "name" }], "At 6 a.m. Mr. Seitkali unlocked the lab.");
    expect(check.done).toBe(true);
  });

  it("does not count 'I am' as a time", () => {
    const check = checkDrillAnswer([{ type: "concrete" }], "I am the kind of person who tries.");
    expect(check.done).toBe(false);
  });

  it("rejects an answer that only swaps a word", () => {
    const check = checkDrillAnswer(
      [{ type: "rewritten" }],
      "This experience taught me to never quit and that hard work pays off.",
      "This experience taught me to never give up and that hard work pays off.",
    );
    expect(check.done).toBe(false);
  });
});

describe("currentStreak", () => {
  it("counts consecutive days back from today", () => {
    expect(currentStreak(["2026-09-28", "2026-09-27", "2026-09-26", "2026-09-24"], "2026-09-28")).toBe(3);
  });

  it("keeps yesterday's streak alive until today is practised", () => {
    expect(currentStreak(["2026-09-27", "2026-09-26"], "2026-09-28")).toBe(2);
  });

  it("is zero after a missed day, and crosses month ends", () => {
    expect(currentStreak(["2026-09-26"], "2026-09-28")).toBe(0);
    expect(currentStreak(["2026-10-01", "2026-09-30"], "2026-10-01")).toBe(2);
  });
});

describe("personal drills", () => {
  const reviewId = "3f2c1a9e-0b1d-4c2e-9f3a-5b6c7d8e9f00";
  const line = (type: LineFeedback["type"], quote: string): LineFeedback => ({
    quote,
    type,
    comment: "Comment.",
    suggestion: "Suggestion.",
    example: "Example rewrite.",
  });
  const review = {
    line_feedback: [
      line("strong", "Keep this one."),
      line("cliche", "It changed my life."),
      line("grammar", "He go to school."),
      line("wordy", "It was basically a really very long and tiring day for all of us."),
    ],
  } as EssayReviewV2;

  it("turns flagged sentences into drills and skips the rest", () => {
    const drills = personalDrills(reviewId, "My essay", "", review);
    expect(drills.map((d) => d.source)).toEqual([
      "It changed my life.",
      "It was basically a really very long and tiring day for all of us.",
    ]);
    expect(drills[0].id).toBe(personalDrillId(reviewId, 1));
    expect(drills[0].model).toBe("Example rewrite.");
  });

  it("mixes kinds of problem instead of taking the first five", () => {
    const many = {
      line_feedback: [
        line("cliche", "One."),
        line("cliche", "Two."),
        line("cliche", "Three."),
        line("cliche", "Four."),
        line("cliche", "Five."),
        line("passive", "It was decided."),
      ],
    } as EssayReviewV2;
    const drills = personalDrills(reviewId, "My essay", "", many);
    expect(drills).toHaveLength(5);
    expect(drills.map((d) => d.source)).toEqual(["One.", "Two.", "Three.", "Four.", "It was decided."]);
  });

  it("widens a quoted phrase to its whole sentence", () => {
    const essay = "I moved in May. The decision was made by my parents to move to Almaty. It rained.";
    expect(sentenceAround(essay, "was made")).toBe("The decision was made by my parents to move to Almaty.");
    expect(sentenceAround(essay, "In May. The decision")).toBe(
      "I moved in May. The decision was made by my parents to move to Almaty.",
    );
    expect(sentenceAround(essay, "not in the essay")).toBe("not in the essay");
  });

  it("makes one drill per sentence, even with two flagged phrases in it", () => {
    const essay = "Ever since I was a child, I have always been passionate about medicine. It was decided.";
    const twice = {
      line_feedback: [
        line("cliche", "Ever since I was a child"),
        line("cliche", "I have always been passionate"),
        line("passive", "was decided"),
      ],
    } as EssayReviewV2;
    const drills = personalDrills(reviewId, "My essay", essay, twice);
    expect(drills.map((d) => d.source)).toEqual([
      "Ever since I was a child, I have always been passionate about medicine.",
      "It was decided.",
    ]);
  });

  it("round-trips its id, and rejects anything else", () => {
    expect(parsePersonalDrillId(personalDrillId(reviewId, 3))).toEqual({ reviewId, index: 3 });
    expect(parsePersonalDrillId("spec-show")).toBeNull();
    expect(parsePersonalDrillId("own-not-a-uuid-1")).toBeNull();
  });
});

describe("liteFirst", () => {
  it("moves Flash-Lite models to the front, keeping order", () => {
    expect(liteFirst(["a-flash", "b-flash-lite", "c-flash", "d-flash-lite"])).toEqual([
      "b-flash-lite",
      "d-flash-lite",
      "a-flash",
      "c-flash",
    ]);
  });
});
