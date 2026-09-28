/**
 * The instant, no-AI check for a training drill: runs a drill's rules over
 * the student's answer and says, rule by rule, what passed and what to fix.
 * Built on the same phrase lists as the Essay Studio live check. Plain rules,
 * so approximate — the UI says so. Pure; shared by the drill page and tests.
 */

import { checkEssay, countWords, splitSentences } from "@/lib/essay-check";
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

function runRule(rule: Rule, answer: string, source: string): RuleResult {
  const words = countWords(answer);
  const sentences = splitSentences(withoutAbbreviations(answer)).length || (words > 0 ? 1 : 0);

  switch (rule.type) {
    case "maxWords":
      return {
        ok: words <= rule.n,
        label: `${words} word${words === 1 ? "" : "s"} (limit ${rule.n})`,
        hint: words <= rule.n ? null : `Cut ${words - rule.n} more word${words - rule.n === 1 ? "" : "s"}.`,
      };
    case "minWords":
      return {
        ok: words >= rule.n,
        label: `At least ${rule.n} words`,
        hint: words >= rule.n ? null : "Say a little more — you cut too much.",
      };
    case "maxSentences":
      return {
        ok: sentences <= rule.n,
        label: `${sentences} sentence${sentences === 1 ? "" : "s"} (limit ${rule.n})`,
        hint: sentences <= rule.n ? null : `Keep it to ${rule.n} sentence${rule.n === 1 ? "" : "s"}.`,
      };
    case "noCliches": {
      const found = checkEssay(answer).issues.filter((issue) => issue.kind === "cliche");
      const quotes = found.map((issue) => `“${answer.slice(issue.start, issue.end)}”`);
      return {
        ok: found.length === 0,
        label: found.length ? `Cliché: ${quotes.join(", ")}` : "No clichés",
        hint: found.length ? "Replace it with your own words or a specific detail." : null,
      };
    }
    case "noFillers": {
      const n = checkEssay(answer).metrics.fillers;
      return {
        ok: n === 0,
        label: n ? `${n} filler word${n === 1 ? "" : "s"} (very, really, basically…)` : "No filler words",
        hint: n ? "Cut them, or replace them with something precise." : null,
      };
    }
    case "noPassive": {
      const found = checkEssay(answer).issues.filter((issue) => issue.kind === "passive");
      const quotes = found.map((issue) => `“${answer.slice(issue.start, issue.end)}”`);
      return {
        ok: found.length === 0,
        label: found.length ? `Passive voice: ${quotes.join(", ")}` : "Active voice",
        hint: found.length ? "Say who did it: “I wrote”, not “was written by me”." : null,
      };
    }
    case "avoid": {
      const found = rule.words.filter((word) => containsWord(answer, word));
      return {
        ok: found.length === 0,
        label: found.length ? `Still ${rule.label}: “${found.join("”, “")}”` : `No ${rule.label}`,
        hint: found.length ? "Show it through what happened instead of naming it." : null,
      };
    }
    case "include": {
      const ok = new RegExp(rule.pattern, "i").test(answer);
      return { ok, label: rule.label, hint: ok ? null : rule.hint };
    }
    case "concrete": {
      const ok = hasConcrete(answer);
      return {
        ok,
        label: ok ? "Has a concrete detail" : "No concrete detail yet",
        hint: ok ? null : "Add a number, a time, a name or a quote — something a reader can picture.",
      };
    }
    case "sensory": {
      const ok = SENSORY.test(answer);
      return {
        ok,
        label: ok ? "Something a reader can see, hear or smell" : "Nothing to see, hear or smell yet",
        hint: ok ? null : "Add one detail for the senses: a colour, a sound, a smell.",
      };
    }
    case "name": {
      const ok = hasName(answer);
      return {
        ok,
        label: ok ? "Names a real person or place" : "No name yet",
        hint: ok ? null : "Give the person a name — “Mr. Seitkali”, “my aunt Gulnara”.",
      };
    }
    case "atMostOf": {
      const found = rule.words.filter((word) => containsWord(answer, word));
      const ok = found.length <= rule.max;
      return {
        ok,
        label: ok ? rule.label : `Mentions ${found.length}: ${found.join(", ")}`,
        hint: ok ? null : "Pick just one and go deeper into it.",
      };
    }
    case "rewritten": {
      const ok = overlapWithSource(answer, source) < 0.7;
      return {
        ok,
        label: ok ? "Really rewritten" : "Too close to the original",
        hint: ok ? null : "Start from a new angle rather than swapping a word or two.",
      };
    }
  }
}

export function checkDrillAnswer(rules: Rule[], answer: string, source = ""): DrillCheck {
  const results = rules.map((rule) => runRule(rule, answer, source));
  const passed = results.filter((result) => result.ok).length;
  return { results, passed, done: passed === results.length };
}
