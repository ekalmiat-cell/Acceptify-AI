"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  Copy,
  Dumbbell,
  FilePlus2,
  Lock,
  PenLine,
  Target,
  TrendingUp,
} from "lucide-react";

import { UniversityLogo } from "@/components/shared/university-logo";
import { CRITERIA, readinessFor } from "@/lib/essay-rubric";
import { UNITS } from "@/lib/training/drills";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";
import type {
  EssayReviewRead,
  EssayReviewV2,
  LineFeedback,
  LineFeedbackType,
  ParagraphRole,
} from "@/types/essay";

const TYPE_STYLE: Record<LineFeedbackType, { label: string; mark: string; dot: string }> = {
  cliche: { label: "Overused", mark: "bg-amber-400/20 shadow-[inset_0_-2px_0_0_rgb(251_191_36)]", dot: "bg-amber-400" },
  vague: { label: "Vague", mark: "bg-sky-400/15 shadow-[inset_0_-2px_0_0_rgb(56_189_248)]", dot: "bg-sky-400" },
  telling: { label: "Telling, not showing", mark: "bg-violet-400/15 shadow-[inset_0_-2px_0_0_rgb(167_139_250)]", dot: "bg-violet-400" },
  passive: { label: "Passive", mark: "bg-rose-400/15 shadow-[inset_0_-2px_0_0_rgb(251_113_133)]", dot: "bg-rose-400" },
  wordy: { label: "Wordy", mark: "bg-slate-400/15 shadow-[inset_0_-2px_0_0_rgb(148_163_184)]", dot: "bg-slate-400" },
  grammar: { label: "Grammar", mark: "bg-red-500/15 shadow-[inset_0_-2px_0_0_rgb(239_68_68)]", dot: "bg-red-500" },
  strong: { label: "Keep this", mark: "bg-emerald-400/15 shadow-[inset_0_-2px_0_0_rgb(52_211_153)]", dot: "bg-emerald-400" },
};

const ROLE_LABEL: Record<ParagraphRole, string> = {
  hook: "Hook",
  context: "Context",
  story: "Story",
  turning_point: "Turning point",
  reflection: "Reflection",
  conclusion: "Conclusion",
  other: "Other",
};

const TONE_TEXT = {
  success: "text-emerald-400",
  brand: "text-brand",
  warning: "text-amber-400",
  danger: "text-rose-400",
} as const;

const TONE_STROKE = {
  success: "#34d399",
  brand: "#4a8bff",
  warning: "#fbbf24",
  danger: "#fb7185",
} as const;

export function EssayReviewResults({
  review,
  university,
  onRevise,
  onNewEssay,
}: {
  review: EssayReviewRead;
  university: University | null;
  onRevise: () => void;
  onNewEssay: () => void;
}) {
  const result = review.analysis_result as EssayReviewV2;
  const readiness = readinessFor(result.overall_score);

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:grid-cols-[auto_1fr]">
        <ScoreRing score={result.overall_score} tone={readiness.tone} />
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-semibold", TONE_TEXT[readiness.tone])}>{readiness.label}</span>
            {result.revision ? <Delta from={result.revision.previous_score} to={result.overall_score} /> : null}
            {university ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                <UniversityLogo university={university} className="size-4 rounded p-0 text-[0.4rem]" />
                {university.shortName}
              </span>
            ) : null}
          </div>
          <h2 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">{result.headline_verdict}</h2>
          {result.essay_summary ? (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">How a reader read it: </span>
              {result.essay_summary}
            </p>
          ) : null}
          {result.cap ? (
            <p className="flex items-start gap-2 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm">
              <Lock className="mt-0.5 size-4 shrink-0 text-amber-400" />
              <span>
                <span className="font-semibold">Held at {result.cap.max}:</span> {result.cap.reason}{" "}
                <span className="text-muted-foreground">
                  Without this, the criteria alone would give {result.weighted_score}.
                </span>
              </span>
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={onRevise}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
            >
              <PenLine className="size-4" />
              Revise this draft
            </button>
            <button
              type="button"
              onClick={onNewEssay}
              className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <FilePlus2 className="size-4" />
              New essay
            </button>
            <Link
              href="/dashboard/training"
              className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
            >
              <Dumbbell className="size-4" />
              Practise weak sentences
            </Link>
            <CopyButton review={review} />
          </div>
        </div>
      </section>

      <PathTo90 result={result} />

      {result.revision ? <RevisionCard revision={result.revision} /> : null}

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h3 className="font-heading text-lg font-semibold">Score breakdown</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {CRITERIA.map((c) => {
            const item = result.criteria[c.key];
            return (
              <div key={c.key} className="rounded-xl border bg-muted/20 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {c.label} <span className="font-normal text-muted-foreground">· {c.weight}%</span>
                  </p>
                  <span className="font-mono text-sm font-semibold">{item.score}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.score}%`, background: TONE_STROKE[readinessFor(item.score).tone] }}
                  />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.evidence}</p>
                {item.to_improve ? (
                  <p className="mt-2 flex gap-1.5 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand" />
                    {item.to_improve}
                  </p>
                ) : null}
                {item.score < 80 && UNITS.some((unit) => unit.criterion === c.key) ? (
                  <Link
                    href={`/dashboard/training?focus=${c.key}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                  >
                    <Dumbbell className="size-4" />
                    Train this skill
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <AnnotatedEssay text={review.essay_text} result={result} />

      <div className="grid gap-5 lg:grid-cols-2">
        {result.strengths.length ? (
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="font-heading text-base font-semibold">What already works</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {result.strengths.map((s) => (
                <li key={s} className="flex gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {result.university_fit && university ? (
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
                <UniversityLogo university={university} className="size-6 rounded-md p-0.5 text-[0.5rem]" />
                Fit with {university.shortName}
              </h3>
              <span className="font-mono text-sm font-semibold">{result.university_fit.score}/100</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{result.university_fit.assessment}</p>
            <ChipList title="Shows" items={result.university_fit.aligned_values} tone="good" />
            <ChipList title="Missing" items={result.university_fit.gaps} tone="gap" />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function ScoreRing({ score, tone }: { score: number; tone: keyof typeof TONE_STROKE }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto size-36 shrink-0">
      <svg viewBox="0 0 128 128" className="size-full -rotate-90">
        <circle cx="64" cy="64" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-4xl font-bold tabular-nums">{score}</span>
        <span className="text-xs text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

function Delta({ from, to }: { from: number; to: number }) {
  const diff = to - from;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        diff > 0 ? "bg-emerald-400/15 text-emerald-400" : diff < 0 ? "bg-rose-400/15 text-rose-400" : "bg-muted text-muted-foreground",
      )}
    >
      <TrendingUp className="size-3.5" />
      {from} → {to} ({diff > 0 ? "+" : ""}
      {diff})
    </span>
  );
}

function PathTo90({ result }: { result: EssayReviewV2 }) {
  if (!result.path_to_90.length) return null;
  const done = result.overall_score >= 90;
  const reach = Math.min(100, result.overall_score + result.path_to_90.reduce((s, p) => s + p.estimated_gain, 0));

  return (
    <section className="rounded-2xl border border-brand/30 bg-brand/[0.06] p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Target className="size-5 text-brand" />
          {done ? "Optional polish" : "Your path to 90+"}
        </h3>
        <span className="text-sm text-muted-foreground">
          Do these three and you could reach about <span className="font-semibold text-foreground">{reach}</span>
        </span>
      </div>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {result.path_to_90.map((step, index) => (
          <li key={step.change} className="hover-lift flex flex-col gap-2 rounded-xl bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
                +{step.estimated_gain}
              </span>
            </div>
            <p className="text-sm font-semibold">{step.change}</p>
            {step.why ? <p className="text-sm text-muted-foreground">{step.why}</p> : null}
            <p className="mt-auto text-[11px] tracking-wide text-muted-foreground uppercase">
              {CRITERIA.find((c) => c.key === step.criterion)?.short}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RevisionCard({ revision }: { revision: NonNullable<EssayReviewV2["revision"]> }) {
  return (
    <section className="grid gap-4 rounded-2xl border bg-card p-5 sm:p-6 md:grid-cols-2">
      <div>
        <h3 className="font-heading text-base font-semibold">Better than last draft</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {revision.improved.length ? (
            revision.improved.map((item) => (
              <li key={item} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">No clear improvement yet.</li>
          )}
        </ul>
      </div>
      <div>
        <h3 className="font-heading text-base font-semibold">Still to fix</h3>
        <ul className="mt-2 flex flex-col gap-1.5">
          {revision.still_to_fix.map((item) => (
            <li key={item} className="flex gap-2 text-sm">
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-amber-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface Placed {
  item: LineFeedback;
  number: number;
  start: number;
  end: number;
}

/** The essay with every commented quote marked and numbered. */
function AnnotatedEssay({ text, result }: { text: string; result: EssayReviewV2 }) {
  const [active, setActive] = useState<number | null>(null);
  const markRefs = useRef(new Map<number, HTMLElement>());

  const placed = useMemo(() => placeFeedback(text, result.line_feedback), [text, result.line_feedback]);
  const unplaced = result.line_feedback.filter((item) => !placed.some((p) => p.item === item));

  const focus = (number: number) => {
    setActive(number);
    markRefs.current.get(number)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const body: React.ReactNode[] = [];
  let cursor = 0;
  for (const p of [...placed].sort((a, b) => a.start - b.start)) {
    if (p.start > cursor) body.push(text.slice(cursor, p.start));
    body.push(
      <mark
        key={p.number}
        ref={(el) => {
          if (el) markRefs.current.set(p.number, el);
        }}
        onClick={() => setActive(p.number)}
        className={cn(
          "cursor-pointer rounded-[3px] text-inherit transition-all",
          TYPE_STYLE[p.item.type].mark,
          active === p.number && "ring-2 ring-brand",
        )}
      >
        {text.slice(p.start, p.end)}
        <sup className="ml-0.5 font-sans text-[10px] font-bold text-brand">{p.number}</sup>
      </mark>,
    );
    cursor = p.end;
  }
  body.push(text.slice(cursor));

  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b p-5 sm:px-6">
        <h3 className="font-heading text-lg font-semibold">Sentence by sentence</h3>
        {result.paragraph_map.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {result.paragraph_map.map((p) => (
              <span
                key={p.paragraph}
                title={p.note}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
                  p.strength === "strong" && "border-emerald-400/40 text-emerald-400",
                  p.strength === "weak" && "border-rose-400/40 text-rose-400",
                )}
              >
                <span className="font-mono text-muted-foreground">¶{p.paragraph}</span>
                <span className="font-semibold">{ROLE_LABEL[p.role]}</span>
                <span className="opacity-70">· {p.strength}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="p-5 font-serif text-[17px] leading-[1.9] whitespace-pre-wrap sm:px-6">{body}</div>
        <ol className="flex max-h-[720px] flex-col gap-2 overflow-y-auto border-t p-4 lg:sticky lg:top-20 lg:border-t-0 lg:border-l">
          {[...placed.map((p) => ({ item: p.item, number: p.number })), ...unplaced.map((item) => ({ item, number: null }))].map(
            ({ item, number }) => (
              <li key={`${number}-${item.quote}`}>
                <button
                  type="button"
                  onClick={() => number !== null && focus(number)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left transition-colors hover:border-brand/40",
                    active === number && number !== null && "border-brand/60 bg-brand/5",
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    {number !== null ? (
                      <span className="flex size-5 items-center justify-center rounded-full bg-brand/15 text-brand">{number}</span>
                    ) : null}
                    <span className={cn("size-2 rounded-full", TYPE_STYLE[item.type].dot)} />
                    {TYPE_STYLE[item.type].label}
                  </div>
                  <p className="mt-1.5 line-clamp-2 font-serif text-[13px] text-muted-foreground italic">“{item.quote}”</p>
                  <p className="mt-1.5 text-sm">{item.comment}</p>
                  {item.suggestion ? <p className="mt-1 text-sm text-muted-foreground">{item.suggestion}</p> : null}
                  {item.example ? (
                    <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[13px]">
                      <span className="font-semibold text-brand">For example: </span>
                      {item.example}
                    </p>
                  ) : null}
                </button>
              </li>
            ),
          )}
        </ol>
      </div>
    </section>
  );
}

/** Finds each quote in the essay, skipping any that overlap an earlier one. */
function placeFeedback(text: string, items: LineFeedback[]): Placed[] {
  const lower = text.toLowerCase();
  const placed: Placed[] = [];
  let number = 1;
  for (const item of items) {
    let start = text.indexOf(item.quote);
    if (start === -1) start = lower.indexOf(item.quote.toLowerCase());
    if (start === -1) continue;
    const end = start + item.quote.length;
    if (placed.some((p) => start < p.end && end > p.start)) continue;
    placed.push({ item, number: number++, start, end });
  }
  return placed;
}

function ChipList({ title, items, tone }: { title: string; items: string[]; tone: "good" | "gap" }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">{title}</span>
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            tone === "good" ? "bg-emerald-400/15 text-emerald-400" : "bg-amber-400/15 text-amber-400",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CopyButton({ review }: { review: EssayReviewRead }) {
  const [copied, setCopied] = useState(false);
  const result = review.analysis_result as EssayReviewV2;

  const copy = async () => {
    const lines = [
      `Acceptify essay review — ${review.title}`,
      `Score: ${result.overall_score}/100 (${readinessFor(result.overall_score).label})`,
      result.headline_verdict,
      "",
      "Path to 90+:",
      ...result.path_to_90.map((s, i) => `${i + 1}. ${s.change} (+${s.estimated_gain})`),
      "",
      ...CRITERIA.map((c) => `${c.label}: ${result.criteria[c.key].score} — ${result.criteria[c.key].to_improve}`),
      "",
      "Comments:",
      ...result.line_feedback.map((f) => `• "${f.quote}" — ${f.comment} ${f.suggestion}`.trim()),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      toast.success("Feedback copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      Copy feedback
    </button>
  );
}
