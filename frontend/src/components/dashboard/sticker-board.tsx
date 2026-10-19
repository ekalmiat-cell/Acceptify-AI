"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Heart } from "lucide-react";

import { UniversityLogo } from "@/components/shared/university-logo";
import type { PortfolioEntry } from "@/lib/portfolio";
import { formatProbability } from "@/lib/probability";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { MatchCategory } from "@/types/domain";

/** Safest on the left, the dream on the right — the way a student reads their list. */
const COLUMNS: MatchCategory[] = ["safe", "target", "reach"];

const TAPE: Record<MatchCategory, string> = {
  safe: "bg-[#2f6feb]/20",
  target: "bg-[#f5c542]/40",
  reach: "bg-[#e5484d]/20",
};

const copy = defineCopy({
  en: {
    columns: {
      safe: { title: "Backups", note: "safe — you're over their bar" },
      target: { title: "Realistic", note: "target — a fair fight" },
      reach: { title: "Dreams", note: "reach — worth the shot" },
    },
    fit: "fit",
    chance: "chance",
    dream: "your dream",
    empty: "nothing here yet",
  },
  ru: {
    columns: {
      safe: { title: "Запасные", note: "надёжные — ты выше их планки" },
      target: { title: "Реально", note: "целевые — честная борьба" },
      reach: { title: "Мечта", note: "амбициозные — стоит попробовать" },
    },
    fit: "соответствие",
    chance: "шанс",
    dream: "твоя мечта",
    empty: "пока пусто",
  },
});

/** A small, stable tilt per university so the board looks hand-made but never jumps. */
function tiltFor(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ((Math.abs(hash) % 7) - 3) * 0.9;
}

/**
 * The shortlist as stickers on a board, in three columns by category. Each
 * sticker is slapped on with a little bounce; the student's dream university
 * gets a heart drawn on it.
 */
export function StickerBoard({
  entries,
  dreamUniversityId,
}: {
  entries: PortfolioEntry[];
  dreamUniversityId: string | null;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const still = useReducedMotion() ?? false;
  let order = 0;

  return (
    <div
      className="grid gap-4 rounded-2xl border bg-mk-deep p-4 sm:p-5 md:grid-cols-3"
      style={{
        backgroundImage: "radial-gradient(color-mix(in oklab, var(--mk-ink) 10%, transparent) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      {COLUMNS.map((category) => {
        const column = entries
          .filter((entry) => entry.category === category)
          .sort((a, b) => b.fitScore - a.fitScore);
        return (
          <section key={category} className="flex flex-col gap-3">
            <header className="px-1">
              <h3 className="font-display text-base font-bold">
                {t.columns[category].title}{" "}
                <span className="font-mono text-xs font-normal text-muted-foreground">{column.length}</span>
              </h3>
              <p className="font-hand text-lg leading-none text-muted-foreground">{t.columns[category].note}</p>
            </header>

            {column.length === 0 ? (
              <p className="rounded-xl border border-dashed px-3 py-6 text-center font-hand text-xl text-muted-foreground">
                {t.empty}
              </p>
            ) : null}

            {column.map(({ university, fitScore, probability }) => {
              const tilt = tiltFor(university.id);
              const dream = university.id === dreamUniversityId;
              const delay = 0.08 * order++;
              return (
                <motion.div
                  key={university.id}
                  initial={still ? false : { opacity: 0, scale: 1.25, rotate: tilt - 8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: tilt, y: 0 }}
                  transition={still ? { duration: 0 } : { delay, type: "spring", stiffness: 420, damping: 18 }}
                  whileHover={still ? undefined : { rotate: 0, scale: 1.03 }}
                  className="relative"
                >
                  {/* A strip of tape holding the sticker on. */}
                  <span
                    aria-hidden
                    className={cn("absolute -top-2 left-1/2 z-10 h-4 w-14 -translate-x-1/2 -rotate-3 rounded-[2px]", TAPE[category])}
                  />
                  <Link
                    href={`/dashboard/universities/${university.slug}`}
                    className="block rounded-2xl border-4 border-white bg-mk-surface p-3 shadow-[0_10px_24px_-14px_rgba(11,31,58,0.55)] ring-1 ring-mk-ink/10 transition-shadow hover:shadow-[0_16px_30px_-14px_rgba(11,31,58,0.6)] dark:border-mk-surface"
                  >
                    <div className="flex items-center gap-2.5">
                      <UniversityLogo university={university} className="size-9 rounded-lg p-0.5 text-[0.6rem]" />
                      <div className="min-w-0">
                        <p className="truncate font-heading text-sm font-semibold">{university.shortName}</p>
                        <p className="truncate text-xs text-muted-foreground">{university.city}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-2 border-t border-dashed pt-2">
                      <div>
                        <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{t.fit}</p>
                        <p className="font-heading text-xl leading-none font-semibold tabular-nums">{fitScore}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{t.chance}</p>
                        <p className="font-mono text-sm font-semibold">{formatProbability(probability.p)}</p>
                      </div>
                    </div>
                  </Link>
                  {dream ? (
                    <span className="pointer-events-none absolute -right-2 -bottom-3 flex rotate-[-10deg] items-center gap-1 font-hand text-lg leading-none text-[#e5484d]">
                      <Heart className="size-4 fill-[#e5484d]" />
                      {t.dream}
                    </span>
                  ) : null}
                </motion.div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
