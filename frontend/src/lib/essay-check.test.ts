import { describe, expect, it } from "vitest";

import { checkEssay, splitSentences } from "@/lib/essay-check";

describe("checkEssay", () => {
  it("flags clichés with their exact position", () => {
    const text = "Ever since I was a child, I loved radios.";
    const result = checkEssay(text);
    const cliche = result.issues.find((i) => i.kind === "cliche");
    expect(cliche).toBeDefined();
    expect(text.slice(cliche!.start, cliche!.end)).toBe("Ever since I was a child");
    expect(result.metrics.cliches).toBe(1);
  });

  it("matches clichés written with a curly apostrophe", () => {
    expect(checkEssay("In today’s society, phones rule.").metrics.cliches).toBe(1);
  });

  it("flags passive voice but not adjectives like 'tired'", () => {
    const text = "It was decided that the radio was broken. I was tired.";
    const passive = checkEssay(text).issues.filter((i) => i.kind === "passive");
    expect(passive.map((i) => text.slice(i.start, i.end))).toEqual(["was decided", "was broken"]);
    expect(checkEssay("I was tired.").metrics.passive).toBe(0);
    expect(checkEssay("I was really frustrated and so exhausted.").metrics.passive).toBe(0);
    expect(checkEssay("The bridge was quickly built by volunteers.").metrics.passive).toBe(1);
  });

  it("counts filler words", () => {
    expect(checkEssay("It was really very hard and basically impossible.").metrics.fillers).toBe(3);
  });

  it("marks sentences with concrete detail", () => {
    const result = checkEssay("I spent 40 evenings in Shymkent with a borrowed multimeter from Aidos.");
    expect(result.metrics.specifics).toBe(1);
    expect(result.issues.some((i) => i.kind === "specific")).toBe(true);
  });

  it("never returns overlapping highlights", () => {
    const { issues } = checkEssay(
      "Ever since I was a child it was decided by 3 people in Almaty that I was really gifted.",
    );
    for (let i = 1; i < issues.length; i++) {
      expect(issues[i].start).toBeGreaterThanOrEqual(issues[i - 1].end);
    }
  });

  it("reads monotonous sentence rhythm as low variety", () => {
    const flat = "I went to school. I did my homework. I ate my lunch. I went back home.";
    expect(checkEssay(flat).metrics.variety).toBe("low");
  });

  it("handles an empty essay", () => {
    const result = checkEssay("");
    expect(result.words).toBe(0);
    expect(result.issues).toEqual([]);
    expect(result.quickFixes).toBe(0);
  });
});

describe("splitSentences", () => {
  it("returns offsets that point back into the text", () => {
    const text = "First sentence here. Second one! Third?";
    for (const s of splitSentences(text)) {
      expect(text.slice(s.start, s.end)).toBe(s.text);
    }
  });
});
