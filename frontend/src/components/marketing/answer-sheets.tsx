"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface AnswerSheet {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
}

export interface SheetExamples {
  example: string;
  score: { programme: string; category: string };
  breakdown: { rows: [string, number][]; weakest: string };
  plan: { items: [string, boolean][] };
}

const EASE = [0.16, 1, 0.3, 1] as const;
const TILT = ["-rotate-1", "rotate-[0.6deg]", "-rotate-[0.4deg]"];

/**
 * "Three answers, not one number" as three sheets taped to the paper, each
 * opening with a small sample of what that answer looks like in the app:
 * a stamped score, a category breakdown, a to-do list.
 */
export function AnswerSheets({ sheets, examples }: { sheets: AnswerSheet[]; examples: SheetExamples }) {
  const reduceMotion = !!useReducedMotion();
  const visuals = [
    <ScoreSample key="score" examples={examples} reduceMotion={reduceMotion} />,
    <BreakdownSample key="breakdown" examples={examples} reduceMotion={reduceMotion} />,
    <PlanSample key="plan" examples={examples} reduceMotion={reduceMotion} />,
  ];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
      {sheets.map((sheet, i) => (
        <motion.article
          key={sheet.title}
          initial={reduceMotion ? false : { opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, delay: i * 0.15, ease: EASE }}
          className={cn(
            "group relative flex flex-col rounded-2xl border border-mk-ink/10 bg-mk-surface p-6 shadow-[0_18px_40px_-30px_rgba(11,31,58,0.5)] transition-transform duration-500 hover:rotate-0 sm:p-7",
            TILT[i],
          )}
        >
          {/* A strip of tape holding the sheet to the page. */}
          <span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-[-3deg] rounded-[3px] bg-[#ffe14d]/70 dark:bg-[#ffd740]/30"
          />

          <div className="relative mb-6 rounded-xl border border-dashed border-mk-ink/15 bg-mk-deep/60 p-5">
            <span className="absolute top-2 right-3 font-mono text-[9px] tracking-[0.2em] text-mk-ink/35 uppercase">
              {examples.example}
            </span>
            {visuals[i]}
          </div>

          <p className="font-mono text-[11px] tracking-[0.2em] text-mk-accent uppercase">{sheet.eyebrow}</p>
          <h3 className="mt-2 font-display text-xl font-semibold text-mk-ink">{sheet.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-mk-ink/60">{sheet.description}</p>
          <ul className="mt-5 flex flex-col gap-2.5 border-t border-mk-ink/10 pt-5">
            {sheet.points.map((point) => (
              <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-mk-ink/70">
                <span className="mt-[0.6rem] h-px w-3 shrink-0 bg-mk-ink/50" />
                {point}
              </li>
            ))}
          </ul>
        </motion.article>
      ))}
    </div>
  );
}

type SampleProps = { examples: SheetExamples; reduceMotion: boolean };

/** A fit score with the category stamped across it. */
function ScoreSample({ examples, reduceMotion }: SampleProps) {
  return (
    <div className="flex h-32 items-center justify-between gap-4">
      <div>
        <p className="font-mono text-[10px] tracking-[0.15em] text-mk-ink/45 uppercase">{examples.score.programme}</p>
        <p className="mt-1 font-display text-6xl leading-none font-bold tracking-tight text-mk-ink">
          72<span className="text-2xl text-mk-ink/35">/100</span>
        </p>
      </div>
      <motion.span
        initial={reduceMotion ? false : { opacity: 0, scale: 1.8, rotate: -24 }}
        whileInView={{ opacity: 1, scale: 1, rotate: -12 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.7 }}
        className="shrink-0 rounded-md border-[3px] border-[#e5484d] px-2.5 py-1 font-display text-sm font-bold tracking-wider text-[#e5484d] uppercase mix-blend-multiply dark:mix-blend-normal"
      >
        {examples.score.category}
      </motion.span>
    </div>
  );
}

/** Four category bars, the weakest one circled in marker. */
function BreakdownSample({ examples, reduceMotion }: SampleProps) {
  const rows = examples.breakdown.rows;
  const weakest = Math.min(...rows.map(([, value]) => value));
  return (
    <ul className="flex h-32 flex-col justify-center gap-2.5">
      {rows.map(([label, value], i) => (
        <li key={label} className="grid grid-cols-[6.5rem_1fr_2rem] items-center gap-3">
          <span className="truncate text-xs font-medium text-mk-ink/70">{label}</span>
          <span className="relative h-2 rounded-full bg-mk-ink/10">
            <motion.span
              className={cn("absolute inset-y-0 left-0 rounded-full", value === weakest ? "bg-[#e5484d]" : "bg-mk-ink")}
              initial={reduceMotion ? false : { width: 0 }}
              whileInView={{ width: `${value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.4 + i * 0.12, ease: EASE }}
              style={reduceMotion ? { width: `${value}%` } : undefined}
            />
            {value === weakest ? (
              <motion.span
                aria-hidden="true"
                initial={reduceMotion ? false : { opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 1.3 }}
                className="absolute top-1/2 ml-1.5 -translate-y-1/2 rounded-sm bg-mk-surface px-1 font-hand text-lg leading-none whitespace-nowrap text-[#e5484d]"
                style={{ left: `${value}%` }}
              >
                ← {examples.breakdown.weakest}
              </motion.span>
            ) : null}
          </span>
          <span className="text-right font-mono text-xs text-mk-ink">{value}</span>
        </li>
      ))}
    </ul>
  );
}

/** A handwritten to-do list, ticks drawn in one by one. */
function PlanSample({ examples, reduceMotion }: SampleProps) {
  return (
    <ul className="flex h-32 flex-col justify-center gap-2">
      {examples.plan.items.map(([item, done], i) => (
        <li key={item} className="flex items-center gap-3">
          <span className="relative flex size-5 shrink-0 items-center justify-center rounded-[4px] border-2 border-mk-ink/60">
            {done ? (
              <svg viewBox="0 0 20 20" className="absolute -top-1 -right-1 size-6 overflow-visible" aria-hidden="true">
                <motion.path
                  d="M3 10 L 8 15 L 19 2"
                  fill="none"
                  stroke="#2f6feb"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.6 + i * 0.35 }}
                />
              </svg>
            ) : null}
          </span>
          <span className={cn("font-hand text-xl leading-tight text-mk-ink", done && "text-mk-ink/45 line-through decoration-[#2f6feb]/60")}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}
