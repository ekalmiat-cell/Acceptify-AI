import { describe, expect, it } from "vitest";
import { z } from "zod";

import { toLocale, plural } from "@/lib/i18n/core";
import { localizeIssue, localizeMessage } from "@/lib/i18n/server-messages";
import { checkDrillAnswer } from "@/lib/training/check";
import { DRILLS, UNITS } from "@/lib/training/drills";

describe("locale", () => {
  it("defaults to Russian and accepts only known languages", () => {
    expect(toLocale(undefined)).toBe("ru");
    expect(toLocale("en")).toBe("en");
    expect(toLocale("de")).toBe("ru");
  });

  it("picks Russian word forms by count", () => {
    const words = (n: number) => plural("ru", n, { one: "слово", few: "слова", many: "слов" });
    expect([1, 2, 5, 11, 21, 22, 25].map(words)).toEqual([
      "слово",
      "слова",
      "слов",
      "слов",
      "слово",
      "слова",
      "слов",
    ]);
    expect(plural("en", 1, { one: "word", other: "words" })).toBe("word");
    expect(plural("en", 3, { one: "word", other: "words" })).toBe("words");
  });
});

describe("server messages", () => {
  it("translates known errors and passes unknown ones through", () => {
    expect(localizeMessage("Your session expired. Sign in again.", "ru")).toBe("Сессия истекла. Войди снова.");
    expect(localizeMessage("Your session expired. Sign in again.", "en")).toBe("Your session expired. Sign in again.");
    expect(localizeMessage("Something brand new.", "ru")).toBe("Something brand new.");
  });

  it("translates the daily-limit message with its number", () => {
    expect(localizeMessage("You've used today's 3 for this feature. It refills tomorrow.", "ru")).toContain("(3)");
  });

  it("translates our own validation sentences, and zod's generic ones", () => {
    const own = z.object({ answer: z.string().min(3, "Write your attempt first.") }).safeParse({ answer: "" });
    expect(own.success).toBe(false);
    if (!own.success) expect(localizeIssue(own.error.issues[0], "ru")).toBe("Сначала напиши свой вариант.");

    const generic = z.object({ n: z.number() }).safeParse({ n: "x" });
    if (!generic.success) expect(localizeIssue(generic.error.issues[0], "ru")).toMatch(/[а-я]/);
  });
});

describe("training content in Russian", () => {
  it("has every explanation in both languages", () => {
    for (const unit of UNITS) {
      expect(unit.title.ru && unit.lesson.ru).toBeTruthy();
    }
    for (const drill of DRILLS) {
      expect(drill.title.ru, drill.id).toBeTruthy();
      expect(drill.task.ru, drill.id).toBeTruthy();
      expect(drill.modelWhy.ru, drill.id).toBeTruthy();
      if (drill.kind === "choose") for (const option of drill.options) expect(option.why.ru).toBeTruthy();
    }
  });

  it("keeps the essay material in English", () => {
    const cyrillic = /[а-яё]/i;
    for (const drill of DRILLS) {
      expect(cyrillic.test(drill.model), drill.id).toBe(false);
      if (drill.source) expect(cyrillic.test(drill.source), drill.id).toBe(false);
      if (drill.kind === "rewrite") expect(cyrillic.test(drill.placeholder), drill.id).toBe(false);
    }
  });

  it("explains a check in Russian while quoting the English answer as written", () => {
    const check = checkDrillAnswer(
      [{ type: "noCliches" }, { type: "maxWords", n: 3 }],
      "It changed my life forever.",
      "",
      "ru",
    );
    expect(check.results[0].label).toBe("Клише: «changed my life»");
    expect(check.results[1].label).toBe("5 слов (лимит 3)");
    expect(check.results[1].hint).toBe("Убери ещё 2 слова.");
  });
});
