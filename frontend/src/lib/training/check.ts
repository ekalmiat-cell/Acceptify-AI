/**
 * The instant, no-AI check for a training drill: runs a drill's rules over
 * the student's answer and says, rule by rule, what passed and what to fix.
 * Built on the same phrase lists as the Essay Studio live check. Plain rules,
 * so approximate — the UI says so. Pure; shared by the drill page and tests.
 */

import { checkEssay, countWords, splitSentences } from "@/lib/essay-check";
import { defineCopy, plural, type Locale } from "@/lib/i18n/core";
import type { Rule } from "@/lib/training/drills";

export interface RuleResult {
  ok: boolean;
  /** What was checked, e.g. "No clichés" or "32 words (limit 40)". */
  label: string;
  /** What to do about it, when it failed. */
  hint: string | null;
}

export interface DrillCheck {
  results: RuleResult[];
  passed: number;
  /** Every rule passed. */
  done: boolean;
}

const NUMBER_WORDS =
  /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand)\b/i;

const SENSORY =
  /\b(saw|see|seen|look\w*|watch\w*|glow\w*|shin\w*|bright|dark|red|blue|green|yellow|white|black|grey|gray|orange|purple|heard|hear|loud|quiet|silen\w*|whisper\w*|shout\w*|yell\w*|hum\w*|buzz\w*|crackl\w*|creak\w*|click\w*|beep\w*|ring\w*|song|music|played|playing|smell\w*|smelled|scent|stink\w*|stank|taste\w*|sweet|sour|bitter|salty|spic\w*|touch\w*|rough|smooth|sticky|cold|hot|warm|wet|sharp|soft|steam\w*|smoke|smok\w*|shout|sizzl\w*|knife|forearm)\b/i;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Matches a word or phrase at a word start, so "passion" catches "passionate". */
function containsWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegExp(word)}`, "i").test(text);
}

/**
 * Takes the full stops out of "Mr." and "a.m." so they don't end sentences
 * — "Mr. Seitkali" is one name, not two sentences.
 */
function withoutAbbreviations(text: string): string {
  return text.replace(/\b(Mr|Mrs|Ms|Dr|St)\./g, "$1").replace(/\b([ap])\.m\./gi, "$1m");
}

const TITLE = /^["“(]?(Mr|Mrs|Ms|Dr)$/;

/** A capitalised word that isn't just the start of a sentence. */
function hasName(text: string): boolean {
  return splitSentences(withoutAbbreviations(text)).some((sentence) => {
    const words = sentence.text.split(/\s+/);
    return (
      TITLE.test(words[0]) ||
      words.slice(1).some((word) => TITLE.test(word) || (/^["“(]?[A-Z][a-z]{2,}/.test(word) && !/^["“(]?I('|’|$)/.test(word)))
    );
  });
}

function hasConcrete(text: string): boolean {
  return (
    /\d/.test(text) ||
    NUMBER_WORDS.test(text) ||
    /\b(o'clock|noon|midnight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)\b/i.test(
      text,
    ) ||
    /["“”]/.test(text) ||
    hasName(text)
  );
}

function wordSet(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z']+/g) ?? []);
}

/** Share of the answer's words that were already in the source. */
function overlapWithSource(answer: string, source: string): number {
  const mine = wordSet(answer);
  if (mine.size === 0) return 1;
  const theirs = wordSet(source);
  let shared = 0;
  for (const word of mine) if (theirs.has(word)) shared++;
  return shared / mine.size;
}

const words = (locale: Locale, n: number) =>
  `${n} ${plural(locale, n, locale === "ru" ? { one: "слово", few: "слова", many: "слов" } : { one: "word", other: "words" })}`;
const sentencesOf = (locale: Locale, n: number) =>
  `${n} ${plural(locale, n, locale === "ru" ? { one: "предложение", few: "предложения", many: "предложений" } : { one: "sentence", other: "sentences" })}`;

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** What each rule says — explanations in the interface language; quotes from the answer stay as written. */
const copy = defineCopy({
  en: {
    limit: (count: string, n: number) => `${count} (limit ${n})`,
    cutMore: (count: string) => `Cut ${count} more.`,
    atLeast: (count: string) => `At least ${count}`,
    sayMore: "Say a little more — you cut too much.",
    keepTo: (count: string) => `Keep it to ${count}.`,
    quote: (text: string) => `“${text}”`,
    cliche: (quotes: string) => `Cliché: ${quotes}`,
    noCliches: "No clichés",
    replaceCliche: "Replace it with your own words or a specific detail.",
    fillers: (n: number) => `${n} filler word${n === 1 ? "" : "s"} (very, really, basically…)`,
    noFillers: "No filler words",
    cutFillers: "Cut them, or replace them with something precise.",
    passive: (quotes: string) => `Passive voice: ${quotes}`,
    active: "Active voice",
    sayWho: "Say who did it: “I wrote”, not “was written by me”.",
    stillFound: (label: string, quotes: string) => `Still ${label}: ${quotes}`,
    noneFound: (label: string) => `No ${label}`,
    showInstead: "Show it through what happened instead of naming it.",
    concrete: "Has a concrete detail",
    noConcrete: "No concrete detail yet",
    addConcrete: "Add a number, a time, a name or a quote — something a reader can picture.",
    sensory: "Something a reader can see, hear or smell",
    noSensory: "Nothing to see, hear or smell yet",
    addSensory: "Add one detail for the senses: a colour, a sound, a smell.",
    name: "Names a real person or place",
    noName: "No name yet",
    addName: "Give the person a name — “Mr. Seitkali”, “my aunt Gulnara”.",
    mentions: (n: number, list: string) => `Mentions ${n}: ${list}`,
    pickOne: "Pick just one and go deeper into it.",
    rewritten: "Really rewritten",
    tooClose: "Too close to the original",
    newAngle: "Start from a new angle rather than swapping a word or two.",
  },
  ru: {
    limit: (count: string, n: number) => `${count} (лимит ${n})`,
    cutMore: (count: string) => `Убери ещё ${count}.`,
    atLeast: (count: string) => `Не меньше: ${count}`,
    sayMore: "Добавь немного — сокращено слишком сильно.",
    keepTo: (count: string) => `Уложись в ${count}.`,
    quote: (text: string) => `«${text}»`,
    cliche: (quotes: string) => `Клише: ${quotes}`,
    noCliches: "Клише нет",
    replaceCliche: "Замени своими словами или конкретной деталью.",
    fillers: (n: number) =>
      `${n} ${plural("ru", n, { one: "слово-паразит", few: "слова-паразита", many: "слов-паразитов" })} (very, really, basically…)`,
    noFillers: "Слов-паразитов нет",
    cutFillers: "Убери их или замени чем-то точным.",
    passive: (quotes: string) => `Пассивный залог: ${quotes}`,
    active: "Активный залог",
    sayWho: "Скажи, кто это сделал: «I wrote», а не «was written by me».",
    stillFound: (label: string, quotes: string) => `${capitalize(label)}: ${quotes}`,
    noneFound: (label: string) => `${capitalize(label)}: всё чисто`,
    showInstead: "Покажи это через события, а не называй прямо.",
    concrete: "Есть конкретная деталь",
    noConcrete: "Конкретной детали пока нет",
    addConcrete: "Добавь число, время, имя или цитату — то, что читатель может представить.",
    sensory: "Есть то, что можно увидеть, услышать или почуять",
    noSensory: "Пока нечего увидеть, услышать или почуять",
    addSensory: "Добавь одну деталь для чувств: цвет, звук, запах.",
    name: "Назван реальный человек или место",
    noName: "Имени пока нет",
    addName: "Дай человеку имя — «Mr. Seitkali», «my aunt Gulnara».",
    mentions: (n: number, list: string) => `Упомянуто сразу ${n}: ${list}`,
    pickOne: "Выбери что-то одно и раскрой глубже.",
    rewritten: "Действительно переписано",
    tooClose: "Слишком близко к оригиналу",
    newAngle: "Зайди с новой стороны, а не меняй одно-два слова.",
  },
});

function runRule(rule: Rule, answer: string, source: string, locale: Locale): RuleResult {
  const t = copy[locale];
  const wordCount = countWords(answer);
  const sentences = splitSentences(withoutAbbreviations(answer)).length || (wordCount > 0 ? 1 : 0);
  const quotes = (texts: string[]) => texts.map(t.quote).join(", ");

  switch (rule.type) {
    case "maxWords":
      return {
        ok: wordCount <= rule.n,
        label: t.limit(words(locale, wordCount), rule.n),
        hint: wordCount <= rule.n ? null : t.cutMore(words(locale, wordCount - rule.n)),
      };
    case "minWords":
      return {
        ok: wordCount >= rule.n,
        label: t.atLeast(words(locale, rule.n)),
        hint: wordCount >= rule.n ? null : t.sayMore,
      };
    case "maxSentences":
      return {
        ok: sentences <= rule.n,
        label: t.limit(sentencesOf(locale, sentences), rule.n),
        hint: sentences <= rule.n ? null : t.keepTo(sentencesOf(locale, rule.n)),
      };
    case "noCliches": {
      const found = checkEssay(answer).issues.filter((issue) => issue.kind === "cliche");
      return {
        ok: found.length === 0,
        label: found.length ? t.cliche(quotes(found.map((issue) => answer.slice(issue.start, issue.end)))) : t.noCliches,
        hint: found.length ? t.replaceCliche : null,
      };
    }
    case "noFillers": {
      const n = checkEssay(answer).metrics.fillers;
      return { ok: n === 0, label: n ? t.fillers(n) : t.noFillers, hint: n ? t.cutFillers : null };
    }
    case "noPassive": {
      const found = checkEssay(answer).issues.filter((issue) => issue.kind === "passive");
      return {
        ok: found.length === 0,
        label: found.length ? t.passive(quotes(found.map((issue) => answer.slice(issue.start, issue.end)))) : t.active,
        hint: found.length ? t.sayWho : null,
      };
    }
    case "avoid": {
      const found = rule.words.filter((word) => containsWord(answer, word));
      return {
        ok: found.length === 0,
        label: found.length ? t.stillFound(rule.label[locale], quotes(found)) : t.noneFound(rule.label[locale]),
        hint: found.length ? t.showInstead : null,
      };
    }
    case "include": {
      const ok = new RegExp(rule.pattern, "i").test(answer);
      return { ok, label: rule.label[locale], hint: ok ? null : rule.hint[locale] };
    }
    case "concrete": {
      const ok = hasConcrete(answer);
      return { ok, label: ok ? t.concrete : t.noConcrete, hint: ok ? null : t.addConcrete };
    }
    case "sensory": {
      const ok = SENSORY.test(answer);
      return { ok, label: ok ? t.sensory : t.noSensory, hint: ok ? null : t.addSensory };
    }
    case "name": {
      const ok = hasName(answer);
      return { ok, label: ok ? t.name : t.noName, hint: ok ? null : t.addName };
    }
    case "atMostOf": {
      const found = rule.words.filter((word) => containsWord(answer, word));
      const ok = found.length <= rule.max;
      return {
        ok,
        label: ok ? rule.label[locale] : t.mentions(found.length, found.join(", ")),
        hint: ok ? null : t.pickOne,
      };
    }
    case "rewritten": {
      const ok = overlapWithSource(answer, source) < 0.7;
      return { ok, label: ok ? t.rewritten : t.tooClose, hint: ok ? null : t.newAngle };
    }
  }
}

export function checkDrillAnswer(rules: Rule[], answer: string, source = "", locale: Locale = "en"): DrillCheck {
  const results = rules.map((rule) => runRule(rule, answer, source, locale));
  const passed = results.filter((result) => result.ok).length;
  return { results, passed, done: passed === results.length };
}
