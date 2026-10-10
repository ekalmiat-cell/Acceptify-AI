"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeIn } from "@/components/shared/fade-in";
import { MatchBadge } from "@/components/shared/match-badge";
import { Slider } from "@/components/ui/slider";
import { predictMatch } from "@/lib/predict";
import type { AchievementCriterionKey } from "@/lib/criteria";
import type { University } from "@/types/domain";
import { UniversityLogo } from "@/components/shared/university-logo";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const copy = defineCopy({
  en: {
    eyebrow: "Live demo",
    title: "Try the prediction engine yourself",
    description:
      "Drag the sliders to match your profile and watch match scores update in real time — this is the same engine behind your dashboard.",
    sat: "SAT score",
    ielts: "IELTS band",
    note: "Scores update instantly using the same weighting as your full dashboard: academics, test scores, and achievement breadth.",
    panel: "Your profile",
    board: "Fit score",
    hint: "drag me",
  },
  ru: {
    eyebrow: "Демо",
    title: "Попробуй движок прогнозов сам",
    description:
      "Двигай ползунки под свой профиль и смотри, как оценки меняются в реальном времени, — это тот же движок, что и в личном кабинете.",
    sat: "Балл SAT",
    ielts: "Балл IELTS",
    note: "Оценки пересчитываются сразу, с теми же весами, что и в кабинете: учёба, баллы тестов и широта достижений.",
    panel: "Твой профиль",
    board: "Балл соответствия",
    hint: "подвигай",
  },
});

const demoUniversityIds = ["uni-mit", "uni-toronto", "uni-nu", "uni-eth"];

// Half of the achievement criteria "achieved", for a representative
// mid-strength demo profile on the marketing page's interactive slider.
const DEMO_ACHIEVEMENTS: Partial<Record<AchievementCriterionKey, boolean>> = {
  research: true,
  olympiads: true,
  hackathons: true,
  leadership: true,
  mun: true,
  awards: true,
  personalEssay: true,
  recommendationLetters: true,
};

export function AiDemoSection({ universities }: { universities: University[] }) {
  const t = useCopy(copy);
  const [gpa, setGpa] = useState(3.6);
  const [sat, setSat] = useState(1380);
  const [ielts, setIelts] = useState(7.0);

  const results = useMemo(() => {
    return demoUniversityIds
      .map((id) => universities.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((university) => ({
        university,
        ...predictMatch(university, {
          gpa,
          satScore: sat,
          actScore: null,
          ieltsScore: ielts,
          toeflScore: null,
          entScore: null,
          achievements: DEMO_ACHIEVEMENTS,
        }),
      }))
      .sort((a, b) => b.score - a.score);
  }, [universities, gpa, sat, ielts]);

  return (
    <section id="ai-demo" className="relative bg-mk-bg py-24 sm:py-32">
      <Container className="relative max-w-6xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          dark
          className="mb-16"
        />

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <FadeIn className="relative flex flex-col gap-7 rounded-2xl border border-mk-ink/10 bg-mk-deep p-7 sm:p-8">
            <p className="font-mono text-[11px] tracking-[0.2em] text-mk-ink/50 uppercase">{t.panel}</p>
            <span className="pointer-events-none absolute top-5 right-6 -rotate-6 font-hand text-2xl text-mk-accent" aria-hidden="true">
              {t.hint} ↓
            </span>
            <DemoSlider
              label="GPA"
              value={gpa}
              onChange={setGpa}
              min={2.0}
              max={4.0}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />
            <DemoSlider
              label={t.sat}
              value={sat}
              onChange={setSat}
              min={900}
              max={1600}
              step={10}
              format={(v) => Math.round(v).toString()}
            />
            <DemoSlider
              label={t.ielts}
              value={ielts}
              onChange={setIelts}
              min={5.0}
              max={9.0}
              step={0.5}
              format={(v) => v.toFixed(1)}
            />

            <p className="border-t border-dashed border-mk-ink/15 pt-5 text-sm leading-relaxed text-mk-ink/55">{t.note}</p>
          </FadeIn>

          <FadeIn delay={0.1} className="flex flex-col rounded-2xl border border-mk-ink/10 bg-mk-surface">
            <p className="border-b border-mk-ink/10 px-6 py-4 font-mono text-[11px] tracking-[0.2em] text-mk-ink/50 uppercase">
              {t.board}
            </p>
            <ul className="flex flex-1 flex-col divide-y divide-mk-ink/10">
              {results.map(({ university, score, category }) => (
                <li key={university.id} className="flex flex-1 items-center gap-4 px-6 py-4">
                  <UniversityLogo university={university} className="size-11 rounded-xl text-xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-mk-ink">{university.name}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-mk-ink/10">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full bg-mk-ink transition-[width] duration-500 ease-out"
                          style={{ width: `${score}%` }}
                        />
                      </span>
                      <MatchBadge category={category} className="hidden shrink-0 sm:inline-flex" />
                    </div>
                  </div>
                  <Odometer value={score} />
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/** A number on rolling drums, each digit sliding to its place like a car's odometer. */
function Odometer({ value }: { value: number }) {
  const reduceMotion = useReducedMotion();
  const digits = String(Math.max(0, Math.min(100, Math.round(value)))).padStart(2, "0").split("");
  return (
    <span className="flex shrink-0 items-baseline font-display text-3xl font-bold text-mk-ink tabular-nums" aria-label={`${value}`}>
      <span className="flex overflow-hidden rounded-md bg-mk-ink px-1 text-mk-bg" aria-hidden="true">
        {digits.map((digit, i) => (
          <span key={digits.length - i} className="relative h-[1.2em] w-[0.72em] overflow-hidden leading-[1.2em]">
            <span
              className={cn("absolute inset-x-0 top-0 flex flex-col text-center", !reduceMotion && "transition-transform duration-700 ease-[cubic-bezier(.2,.9,.3,1.15)]")}
              style={{ transform: `translateY(-${Number(digit) * 10}%)` }}
            >
              {DIGITS.map((d) => (
                <span key={d} className="h-[1.2em]">
                  {d}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
      <span className="ml-1 text-base text-mk-ink/40">%</span>
    </span>
  );
}

function DemoSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs tracking-[0.15em] text-mk-ink/60 uppercase">{label}</span>
        <span className="font-display text-2xl font-bold text-mk-ink tabular-nums">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
