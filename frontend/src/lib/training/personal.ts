/**
 * Drills made from the student's own essay: the sentences their latest AI
 * review flagged (a cliché, telling instead of showing, passive, wordy)
 * become rewrite drills, with the review's own example as the model answer.
 * Reuses a review that was already paid for — no extra AI call. Pure.
 */

import { countWords, splitSentences } from "@/lib/essay-check";
import type { RewriteDrill, Rule, UnitKey } from "@/lib/training/drills";
import type { EssayReviewV2, LineFeedbackType } from "@/types/essay";

export interface PersonalDrill extends RewriteDrill {
  reviewId: string;
  essayTitle: string;
}

/** How many of the essay's sentences are offered as drills at once. */
export const MAX_PERSONAL_DRILLS = 5;

type TrainableType = Exclude<LineFeedbackType, "strong" | "grammar">;

const TRAINABLE: Record<TrainableType, { unit: UnitKey; title: string; rules: (quote: string) => Rule[] }> = {
  cliche: {
    unit: "voice",
    title: "Rewrite your cliché",
    rules: () => [{ type: "noCliches" }, { type: "rewritten" }, { type: "maxSentences", n: 3 }],
  },
  telling: {
    unit: "specificity",
    title: "Show it — your sentence",
    rules: () => [{ type: "concrete" }, { type: "rewritten" }, { type: "maxSentences", n: 3 }],
  },
  vague: {
    unit: "specificity",
    title: "Make your sentence specific",
    rules: () => [{ type: "concrete" }, { type: "rewritten" }, { type: "maxSentences", n: 3 }],
  },
  passive: {
    unit: "concise",
    title: "Say who did it — your sentence",
    rules: () => [{ type: "noPassive" }, { type: "maxSentences", n: 2 }],
  },
  wordy: {
    unit: "concise",
    title: "Tighten your sentence",
    rules: (quote) => [
      { type: "maxWords", n: Math.max(5, Math.floor(countWords(quote) * 0.75)) },
      { type: "noFillers" },
    ],
  },
};

function isTrainable(type: LineFeedbackType): type is TrainableType {
  return type in TRAINABLE;
}

const ID_PATTERN = /^own-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d{1,3})$/;

export function personalDrillId(reviewId: string, index: number): string {
  return `own-${reviewId}-${index}`;
}

/** The review and line a personal drill id points at, or null for any other id. */
export function parsePersonalDrillId(id: string): { reviewId: string; index: number } | null {
  const match = ID_PATTERN.exec(id);
  return match ? { reviewId: match[1], index: Number(match[2]) } : null;
}

/** Of one kind of problem, how many are offered before other kinds get a turn. */
const PER_TYPE_FIRST_PASS = 2;

/**
 * The trainable sentences of one review, as drills (at most
 * MAX_PERSONAL_DRILLS), in essay order — mixing kinds of problem, so five
 * clichés don't crowd out the one passive sentence, and one drill per
 * sentence even when the review flagged two phrases in it.
 */
export function personalDrills(
  reviewId: string,
  essayTitle: string,
  essayText: string,
  review: EssayReviewV2,
): PersonalDrill[] {
  const seen = new Set<string>();
  const candidates = review.line_feedback
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => {
      if (!isTrainable(line.type) || !line.quote.trim()) return false;
      const sentence = sentenceAround(essayText, line.quote);
      if (seen.has(sentence)) return false;
      seen.add(sentence);
      return true;
    });

  const chosen = new Set<number>();
  const perType = new Map<LineFeedbackType, number>();
  for (const { line, index } of candidates) {
    if (chosen.size >= MAX_PERSONAL_DRILLS) break;
    const count = perType.get(line.type) ?? 0;
    if (count >= PER_TYPE_FIRST_PASS) continue;
    perType.set(line.type, count + 1);
    chosen.add(index);
  }
  for (const { index } of candidates) {
    if (chosen.size >= MAX_PERSONAL_DRILLS) break;
    chosen.add(index);
  }

  return [...chosen]
    .sort((a, b) => a - b)
    .map((index) => personalDrill(reviewId, essayTitle, essayText, review, index)!);
}

/** One line of a review as a drill, or null if that line isn't trainable. */
export function personalDrill(
  reviewId: string,
  essayTitle: string,
  essayText: string,
  review: EssayReviewV2,
  index: number,
): PersonalDrill | null {
  const line = review.line_feedback[index];
  if (!line || !isTrainable(line.type) || !line.quote.trim()) return null;
  const kind = TRAINABLE[line.type];
  const source = sentenceAround(essayText, line.quote);
  return {
    id: personalDrillId(reviewId, index),
    reviewId,
    essayTitle,
    unit: kind.unit,
    kind: "rewrite",
    title: kind.title,
    task: [line.comment, line.suggestion].filter(Boolean).join(" "),
    source,
    placeholder: "Rewrite it in your own words…",
    rules: kind.rules(source),
    model: line.example?.trim() || line.suggestion,
    modelWhy: "One possible version from your AI review. Yours should sound like you — don't copy it.",
  };
}

/**
 * The whole sentence (or sentences) of the essay a quote sits in — the review
 * often quotes just a phrase ("was made"), which is hard to rewrite without
 * the rest of the sentence. Falls back to the quote itself.
 */
export function sentenceAround(essayText: string, quote: string): string {
  const needle = quote.trim().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  const haystack = essayText.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').toLowerCase();
  const at = haystack.indexOf(needle);
  if (at === -1) return quote.trim();

  const end = at + needle.length;
  const around = splitSentences(essayText).filter((s) => s.start < end && s.end > at);
  if (around.length === 0) return quote.trim();
  return essayText.slice(around[0].start, around[around.length - 1].end);
}
