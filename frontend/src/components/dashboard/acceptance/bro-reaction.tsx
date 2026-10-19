"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ArsFace, type ArsMood } from "@/components/dashboard/copilot/ars-face";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Band = "top" | "good" | "stretch" | "far";

/** Same cut as the "accepted" stamp at the top; the rest follow the categories loosely. */
function bandFor(score: number): Band {
  if (score > 75) return "top";
  if (score >= 55) return "good";
  if (score >= 35) return "stretch";
  return "far";
}

const MOOD: Record<Band, ArsMood> = { top: "idle", good: "idle", stretch: "thinking", far: "sad" };

const copy = defineCopy({
  en: {
    lines: {
      top: ["{name}, that's strong. Apply!", "Bro, you're in their league.", "This one's yours to take."],
      good: ["Realistic. Fix one weak spot and it's top.", "Solid. Push the weakest bar up.", "Good base — now make it sharp."],
      stretch: ["A reach, not a dead end. Try “what if”.", "Hmm. Let's see what moves the number.", "Ambitious. Keep it, add safer ones."],
      far: ["Far for now. Don't quit — make a plan.", "Tough one. Look at the gaps below.", "Not yet. Keep it as a dream, add backups."],
    },
  },
  ru: {
    lines: {
      top: ["{name}, это мощно. Подавай!", "Бро, ты на их уровне.", "Этот бери, он твой."],
      good: ["Реально. Подтяни одно слабое — и будет топ.", "Крепко. Подними самую низкую полоску.", "Хорошая база, теперь доведи до ума."],
      stretch: ["Амбициозно, но не тупик. Глянь «что если».", "Хм. Давай посмотрим, что двигает цифру.", "Оставляй, но добавь вузы понадёжнее."],
      far: ["Пока далеко. Не сдаёмся — нужен план.", "Сложно. Смотри, чего не хватает, ниже.", "Пока нет. Оставь как мечту, добавь запасные."],
    },
  },
});

/** A stable pick per result, so a re-render does not change what BRO says. */
function pick<T>(items: T[], key: string): T {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return items[Math.abs(hash) % items.length];
}

/**
 * BRO under the fit score: his face reacts to the number (a happy hop for a
 * strong fit, a think for a reach, a droop for a long shot) and he says one
 * short line in a speech bubble.
 */
export function BroReaction({
  score,
  resultKey,
  studentName,
  className,
}: {
  score: number;
  /** Changes when the university or programme changes, so BRO reacts afresh. */
  resultKey: string;
  studentName: string | null;
  className?: string;
}) {
  const locale = useLocale();
  const still = useReducedMotion() ?? false;
  const band = bandFor(score);
  const firstName = studentName?.trim().split(/\s+/)[0] || (locale === "ru" ? "Бро" : "Bro");
  const line = pick(copy[locale].lines[band], resultKey).replace("{name}", firstName);

  return (
    <div key={`${resultKey}:${band}`} className={cn("flex items-end gap-2", className)}>
      <motion.div
        initial={still ? false : { y: 24, opacity: 0, rotate: -12 }}
        animate={
          still
            ? undefined
            : band === "top"
              ? { y: [24, 0, -10, 0, -6, 0], opacity: 1, rotate: [-12, 0, 4, 0, -3, 0] }
              : { y: 0, opacity: 1, rotate: band === "far" ? 6 : 0 }
        }
        transition={band === "top" ? { duration: 1.1, ease: "easeOut" } : { type: "spring", stiffness: 300, damping: 18 }}
        className="w-16 shrink-0"
      >
        <ArsFace mood={MOOD[band]} title="BRO" />
      </motion.div>
      <motion.p
        initial={still ? false : { opacity: 0, x: -6, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ delay: still ? 0 : 0.35, duration: 0.25 }}
        className="relative mb-4 max-w-56 rounded-2xl rounded-bl-sm border border-mk-ink/15 bg-mk-surface px-3 py-1.5 font-hand text-xl leading-tight text-mk-ink shadow-[0_8px_20px_-14px_rgba(11,31,58,0.6)]"
      >
        {line}
      </motion.p>
    </div>
  );
}
