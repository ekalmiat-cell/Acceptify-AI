"use client";

import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { EssayReviewV2, LineFeedback, LineFeedbackType, ParagraphRole } from "@/types/essay";

/**
 * How a teacher's pen marks each kind of comment. Problems are in red, the
 * sentences worth keeping get a blue tick, so the two never look alike.
 */
const PEN: Record<LineFeedbackType, string> = {
  cliche: "rounded-[999px] border-[1.5px] border-[#e5484d] px-1 [box-decoration-break:clone]",
  vague: "underline decoration-wavy decoration-[#e5484d] decoration-[1.5px] underline-offset-[5px]",
  telling: "underline decoration-double decoration-[#e5484d] decoration-[1.5px] underline-offset-[5px]",
  passive: "underline decoration-dashed decoration-[#e5484d] decoration-[1.5px] underline-offset-[5px]",
  wordy: "line-through decoration-[#e5484d]/80 decoration-[1.5px]",
  grammar: "underline decoration-[#e5484d] decoration-2 underline-offset-[5px]",
  strong: "underline decoration-[#2f6feb] decoration-2 underline-offset-[5px]",
};

const INK: Record<LineFeedbackType, string> = {
  cliche: "text-[#e5484d]",
  vague: "text-[#e5484d]",
  telling: "text-[#e5484d]",
  passive: "text-[#e5484d]",
  wordy: "text-[#e5484d]",
  grammar: "text-[#e5484d]",
  strong: "text-[#2f6feb]",
};

const copy = defineCopy({
  en: {
    title: "Checked in red pen",
    hint: "Tap a mark or a note to see how to fix it.",
    types: {
      cliche: "overused",
      vague: "vague",
      telling: "telling, not showing",
      passive: "passive",
      wordy: "cut this",
      grammar: "grammar",
      strong: "keep this",
    } as Record<LineFeedbackType, string>,
    sample: {
      cliche: "dream",
      vague: "things",
      telling: "I was sad",
      passive: "was done",
      wordy: "very really",
      grammar: "it's",
      strong: "my hands shook",
    } as Record<LineFeedbackType, string>,
    roles: {
      hook: "Hook",
      context: "Context",
      story: "Story",
      turning_point: "Turning point",
      reflection: "Reflection",
      conclusion: "Conclusion",
      other: "Other",
    } as Record<ParagraphRole, string>,
    strength: { strong: "strong", adequate: "adequate", weak: "weak" },
    howToFix: "How to fix",
    forExample: "For example: ",
    moreNotes: "More notes",
  },
  ru: {
    title: "Проверено красной ручкой",
    hint: "Нажми на пометку или заметку на полях — покажу, как исправить.",
    types: {
      cliche: "заезженно",
      vague: "размыто",
      telling: "рассказ вместо показа",
      passive: "пассив",
      wordy: "лишнее",
      grammar: "грамматика",
      strong: "оставь так",
    },
    sample: {
      cliche: "dream",
      vague: "things",
      telling: "I was sad",
      passive: "was done",
      wordy: "very really",
      grammar: "it's",
      strong: "my hands shook",
    },
    roles: {
      hook: "Начало",
      context: "Контекст",
      story: "История",
      turning_point: "Поворот",
      reflection: "Рефлексия",
      conclusion: "Концовка",
      other: "Другое",
    },
    strength: { strong: "сильно", adequate: "нормально", weak: "слабо" },
    howToFix: "Как исправить",
    forExample: "Например: ",
    moreNotes: "Ещё заметки",
  },
});

type Copy = (typeof copy)["en"];

interface Placed {
  item: LineFeedback;
  number: number;
  start: number;
  end: number;
}

/** One ruled line of the paper; the essay text sits on it exactly. */
const LINE = 32;
const GAP = 10;

/**
 * The essay as a checked page from a notebook: each commented quote is
 * marked in pen, numbered, and its note is written in the margin level with
 * the line it is about (below the page on narrow screens).
 */
export function RedPenEssay({ text, result }: { text: string; result: EssayReviewV2 }) {
  const locale = useLocale();
  const t = copy[locale];
  const [active, setActive] = useState<number | null>(null);
  const [tops, setTops] = useState<number[]>([]);
  const [height, setHeight] = useState(0);

  const page = useRef<HTMLDivElement>(null);
  const margin = useRef<HTMLOListElement>(null);
  const marks = useRef(new Map<number, HTMLElement>());
  const notes = useRef(new Map<number, HTMLElement>());

  const placed = useMemo(() => placeFeedback(text, result.line_feedback), [text, result.line_feedback]);
  const unplaced = result.line_feedback.filter((item) => !placed.some((p) => p.item === item));
  const types = [...new Set(placed.map((p) => p.item.type))];

  // Lay the margin notes out level with their marks, pushing a note down
  // when the one above it is still in the way.
  useLayoutEffect(() => {
    const column = margin.current;
    const paper = page.current;
    if (!column || !paper) return;

    const layout = () => {
      const origin = column.getBoundingClientRect().top;
      let bottom = 0;
      const next = placed.map((p) => {
        const mark = marks.current.get(p.number);
        const note = notes.current.get(p.number);
        const want = mark ? mark.getBoundingClientRect().top - origin - 4 : bottom;
        const top = Math.max(want, bottom);
        bottom = top + (note?.offsetHeight ?? 0) + GAP;
        return top;
      });
      setTops((prev) => (prev.length === next.length && prev.every((v, i) => Math.abs(v - next[i]) < 1) ? prev : next));
      setHeight(bottom);
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(paper);
    for (const note of notes.current.values()) observer.observe(note);
    return () => observer.disconnect();
  }, [placed, active]);

  const pick = (number: number, from: "mark" | "note") => {
    setActive((current) => (current === number && from === "note" ? null : number));
    const target = from === "mark" ? notes.current.get(number) : marks.current.get(number);
    target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const body: React.ReactNode[] = [];
  let cursor = 0;
  for (const p of placed) {
    if (p.start > cursor) body.push(text.slice(cursor, p.start));
    body.push(
      <span
        key={p.number}
        ref={(el) => {
          if (el) marks.current.set(p.number, el);
        }}
        role="button"
        tabIndex={0}
        onClick={() => pick(p.number, "mark")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            pick(p.number, "mark");
          }
        }}
        className="cursor-pointer outline-none focus-visible:[&>span:first-child]:bg-[#2f6feb]/10"
      >
        <span
          className={cn(
            "rounded-sm transition-colors",
            PEN[p.item.type],
            active === p.number && (p.item.type === "strong" ? "bg-[#2f6feb]/10" : "bg-[#e5484d]/10"),
          )}
        >
          {text.slice(p.start, p.end)}
        </span>
        <span className={cn("relative -top-2 ml-0.5 font-hand text-lg leading-none font-bold", INK[p.item.type])}>
          {p.number}
          {p.item.type === "strong" ? "✓" : null}
        </span>
      </span>,
    );
    cursor = p.end;
  }
  body.push(text.slice(cursor));

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <header className="border-b p-5 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-heading text-lg font-semibold">{t.title}</h3>
          <p className="text-sm text-muted-foreground">{t.hint}</p>
        </div>
        {types.length ? (
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {types.map((type) => (
              <li key={type} className="flex items-baseline gap-2 text-sm">
                <span lang="en" className={cn("font-serif", PEN[type])}>
                  {t.sample[type]}
                </span>
                <span className={cn("font-hand text-lg leading-none", INK[type])}>— {t.types[type]}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {result.paragraph_map.length ? <ParagraphChips t={t} result={result} /> : null}
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          ref={page}
          className="relative"
          style={{
            // Blue rules across the whole sheet, one per line of text.
            backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${LINE - 1}px, color-mix(in oklab, #2f6feb 22%, transparent) ${LINE - 1}px ${LINE}px)`,
            backgroundPosition: "0 24px",
          }}
        >
          {/* The red margin rule of a school notebook. */}
          <span aria-hidden className="absolute inset-y-0 left-8 w-px bg-[#e5484d]/45 sm:left-10" />
          <div
            lang="en"
            className="py-6 pr-5 pl-12 font-serif text-[17px] whitespace-pre-wrap text-foreground sm:pr-8 sm:pl-16"
            style={{ lineHeight: `${LINE}px` }}
          >
            {body}
          </div>
        </div>

        <ol
          ref={margin}
          className="relative flex flex-col gap-2.5 border-t border-dashed p-4 lg:block lg:min-h-[var(--margin-h)] lg:border-t-0 lg:border-l lg:p-0"
          style={{ "--margin-h": `${height}px` } as CSSProperties}
        >
          {placed.map((p, index) => (
            <li
              key={p.number}
              ref={(el) => {
                if (el) notes.current.set(p.number, el);
              }}
              className="lg:absolute lg:inset-x-4"
              style={{ top: tops[index] ?? 0 }}
            >
              <MarginNote
                t={t}
                item={p.item}
                number={p.number}
                open={active === p.number}
                tilt={index % 2 ? 0.6 : -0.8}
                onClick={() => pick(p.number, "note")}
              />
            </li>
          ))}
        </ol>
      </div>

      {unplaced.length ? (
        <div className="border-t p-5 sm:px-6">
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">{t.moreNotes}</p>
          <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
            {unplaced.map((item) => (
              <li key={item.quote}>
                <MarginNote t={t} item={item} number={null} open tilt={0} quote />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function MarginNote({
  t,
  item,
  number,
  open,
  tilt,
  quote = false,
  onClick,
}: {
  t: Copy;
  item: LineFeedback;
  number: number | null;
  open: boolean;
  tilt: number;
  quote?: boolean;
  onClick?: () => void;
}) {
  const hasFix = Boolean(item.suggestion || item.example);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-expanded={onClick ? open : undefined}
      className={cn(
        "w-full rounded-lg px-2.5 py-1.5 text-left transition-colors enabled:cursor-pointer enabled:hover:bg-muted/50",
        open && onClick && "bg-muted/60",
      )}
    >
      <span className="block origin-left" style={{ transform: `rotate(${tilt}deg)` }}>
        <span className={cn("font-hand text-xl leading-tight font-bold", INK[item.type])}>
          {number !== null ? `${number}${item.type === "strong" ? "✓" : ""} · ` : ""}
          {t.types[item.type]}
        </span>
        {quote ? (
          <span lang="en" className="mt-0.5 block font-serif text-[13px] text-muted-foreground italic">
            “{item.quote}”
          </span>
        ) : null}
        <span className={cn("block font-hand text-[19px] leading-[1.15]", INK[item.type], "opacity-90")}>
          {item.comment}
        </span>
      </span>
      {open && hasFix ? (
        <span className="mt-2 block rounded-md border bg-card px-2.5 py-2 text-[13px] leading-snug">
          {item.suggestion ? (
            <span className="block">
              <span className="font-semibold">{t.howToFix}: </span>
              {item.suggestion}
            </span>
          ) : null}
          {item.example ? (
            <span className="mt-1.5 block text-muted-foreground">
              <span className="font-semibold text-brand">{t.forExample}</span>
              <span lang="en" className="font-serif text-foreground">
                {item.example}
              </span>
            </span>
          ) : null}
        </span>
      ) : null}
    </button>
  );
}

function ParagraphChips({ t, result }: { t: Copy; result: EssayReviewV2 }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {result.paragraph_map.map((p) => (
        <span
          key={p.paragraph}
          title={p.note}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            p.strength === "weak" && "border-[#e5484d]/40 text-[#e5484d]",
            p.strength === "strong" && "border-[#2f6feb]/40 text-[#2f6feb]",
          )}
        >
          <span className="font-mono opacity-70">¶{p.paragraph}</span>
          <span className="font-semibold">{t.roles[p.role]}</span>
          <span className="opacity-70">· {t.strength[p.strength]}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Finds each quote in the essay, skipping any that overlap an earlier one,
 * and numbers them in reading order so the margin reads top to bottom.
 */
function placeFeedback(text: string, items: LineFeedback[]): Placed[] {
  const lower = text.toLowerCase();
  const found: Omit<Placed, "number">[] = [];
  for (const item of items) {
    let start = text.indexOf(item.quote);
    if (start === -1) start = lower.indexOf(item.quote.toLowerCase());
    if (start === -1 || !item.quote) continue;
    const end = start + item.quote.length;
    if (found.some((p) => start < p.end && end > p.start)) continue;
    found.push({ item, start, end });
  }
  return found.sort((a, b) => a.start - b.start).map((p, index) => ({ ...p, number: index + 1 }));
}
