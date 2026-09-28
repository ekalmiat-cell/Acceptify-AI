import Link from "next/link";
import { ArrowRight, Check, Dumbbell, FileText, Flame, PenLine, Sparkles } from "lucide-react";

import { UNIT_ICON } from "@/components/dashboard/training/unit-icons";
import type { CriterionKey } from "@/lib/essay-rubric";
import { criterionShort } from "@/lib/essay-rubric-copy";
import { defineCopy, plural, type Locale } from "@/lib/i18n/core";
import { drillsInUnit, type Drill, type Unit } from "@/lib/training/drills";
import type { PersonalDrill } from "@/lib/training/personal";
import { DAILY_GOAL, type TrainingProgress } from "@/lib/training/progress";
import { cn } from "@/lib/utils";

const copy = defineCopy({
  en: {
    title: "Training",
    subtitle: "Short drills that build one essay skill at a time. About two minutes each, checked instantly.",
    streakTitle: "Days in a row with at least one drill",
    dayStreak: (n: number) => `day${n === 1 ? "" : "s"} in a row`,
    todayGoal: "Today's goal",
    today: "Today",
    upNext: "Up next",
    fromEssay: (title: string) => `A sentence from your essay “${title}”.`,
    focusScored: (label: string, score: number) =>
      `Your last review scored ${label} lowest (${score}/100), so we start there.`,
    focusFirst: (label: string) => `Training ${label} first.`,
    startHook: "Start with the hook — the first thing a reader sees.",
    start: "Start",
    continue: "Continue",
    allDone: "Every drill is done.",
    allDoneNote:
      "Revisit any of them below, or get a fresh AI review in Essay Studio — its weak sentences become new drills here.",
    course: "The course",
    courseDone: (done: number, total: number) => `${done} of ${total} drills done`,
    ownTitle: "Train on your own sentences.",
    ownNote: "Get an AI review in Essay Studio and the sentences it flags turn into drills here.",
    studio: "Essay Studio",
    fromYourEssay: "From your essay",
    yourFocus: "Your focus",
    quickPick: "quick pick",
  },
  ru: {
    title: "Тренировка",
    subtitle: "Короткие упражнения, по одному навыку эссе за раз. Около двух минут каждое, проверка сразу.",
    streakTitle: "Дней подряд хотя бы с одним упражнением",
    dayStreak: (n: number) => plural("ru", n, { one: "день подряд", few: "дня подряд", many: "дней подряд" }),
    todayGoal: "Цель на сегодня",
    today: "Сегодня",
    upNext: "Дальше",
    fromEssay: (title: string) => `Предложение из твоего эссе «${title}».`,
    focusScored: (label: string, score: number) =>
      `В последнем разборе слабее всего оказался критерий «${label}» (${score}/100) — с него и начнём.`,
    focusFirst: (label: string) => `Сначала тренируем критерий «${label}».`,
    startHook: "Начни с первой фразы — это первое, что видит читатель.",
    start: "Начать",
    continue: "Продолжить",
    allDone: "Все упражнения пройдены.",
    allDoneNote:
      "Можно повторить любое из них ниже или получить новый разбор в Эссе-студии — слабые предложения станут новыми упражнениями.",
    course: "Курс",
    courseDone: (done: number, total: number) => `Пройдено ${done} из ${total}`,
    ownTitle: "Тренируйся на своих предложениях.",
    ownNote: "Получи разбор ИИ в Эссе-студии — отмеченные предложения превратятся здесь в упражнения.",
    studio: "Эссе-студия",
    fromYourEssay: "Из твоего эссе",
    yourFocus: "Твой фокус",
    quickPick: "быстрый выбор",
  },
});

export function TrainingHome({
  locale,
  units,
  progress,
  personal,
  essayTitle,
  focus,
}: {
  locale: Locale;
  /** In study order: the weakest criterion's unit first. */
  units: Unit[];
  progress: TrainingProgress;
  /** Drills made from the latest reviewed essay. */
  personal: PersonalDrill[];
  essayTitle: string | null;
  /** The criterion to start with, and why. */
  focus: { criterion: CriterionKey; score: number | null } | null;
}) {
  const t = copy[locale];
  const done = new Set(progress.completed);
  const courseDrills = units.flatMap((unit) => drillsInUnit(unit.key));
  const courseDone = courseDrills.filter((drill) => done.has(drill.id)).length;
  const next: Drill | undefined =
    personal.find((drill) => !done.has(drill.id)) ?? courseDrills.find((drill) => !done.has(drill.id));
  const focusLabel = focus ? criterionShort(focus.criterion, locale) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow-brand">
              <Dumbbell className="size-5" />
            </span>
            {t.title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5" title={t.streakTitle}>
            <Flame className={cn("size-4", progress.streak > 0 ? "text-amber-400" : "text-muted-foreground")} />
            <span className="font-semibold">{progress.streak}</span>
            <span className="text-muted-foreground">{t.dayStreak(progress.streak)}</span>
          </span>
          <span className="inline-flex items-center gap-2 text-muted-foreground" title={t.todayGoal}>
            <span className="flex gap-[3px]">
              {Array.from({ length: DAILY_GOAL }, (_, i) => (
                <span
                  key={i}
                  className={cn("h-3.5 w-2.5 rounded-sm", i < progress.today ? "bg-brand" : "bg-foreground/15")}
                />
              ))}
            </span>
            {t.today} {Math.min(progress.today, DAILY_GOAL)}/{DAILY_GOAL}
          </span>
        </div>
      </header>

      {next ? (
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">{t.upNext}</p>
            <h2 className="mt-1 font-heading text-xl font-semibold">{next.title[locale]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {"reviewId" in next
                ? t.fromEssay(essayTitle ?? "")
                : focus && focusLabel
                  ? focus.score !== null
                    ? t.focusScored(focusLabel, focus.score)
                    : t.focusFirst(focusLabel)
                  : t.startHook}
            </p>
          </div>
          <Link
            href={`/dashboard/training/${next.id}`}
            className="btn-shine inline-flex items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
          >
            {courseDone === 0 && personal.every((d) => !done.has(d.id)) ? t.start : t.continue}
            <ArrowRight className="size-4" />
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-sm">
          <p className="font-semibold">{t.allDone}</p>
          <p className="mt-1 text-muted-foreground">{t.allDoneNote}</p>
        </section>
      )}

      <PersonalSection locale={locale} drills={personal} done={done} essayTitle={essayTitle} />

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold">{t.course}</h2>
          <span className="text-sm text-muted-foreground">{t.courseDone(courseDone, courseDrills.length)}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {units.map((unit) => (
            <UnitCard
              key={unit.key}
              locale={locale}
              unit={unit}
              done={done}
              recommended={unit.criterion === focus?.criterion}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function PersonalSection({
  locale,
  drills,
  done,
  essayTitle,
}: {
  locale: Locale;
  drills: PersonalDrill[];
  done: ReadonlySet<string>;
  essayTitle: string | null;
}) {
  const t = copy[locale];
  if (drills.length === 0) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-dashed p-5 sm:flex-row sm:items-center">
        <FileText className="size-5 shrink-0 text-muted-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t.ownTitle}</span> {t.ownNote}
        </p>
        <Link href="/dashboard/essays" className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
          <Sparkles className="size-4" />
          {t.studio}
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <PenLine className="size-4 text-brand" />
          {t.fromYourEssay}
        </h2>
        <span className="truncate text-sm text-muted-foreground">“{essayTitle}”</span>
      </div>
      <ul className="mt-3 flex flex-col">
        {drills.map((drill) => (
          <li key={drill.id} className="border-t first:border-t-0">
            <Link
              href={`/dashboard/training/${drill.id}`}
              className="group flex items-center gap-3 py-3 transition-colors hover:text-brand"
            >
              <DoneMark done={done.has(drill.id)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{drill.title[locale]}</span>
                <span lang="en" className="block truncate text-[13px] text-muted-foreground">
                  “{drill.source}”
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UnitCard({
  locale,
  unit,
  done,
  recommended,
}: {
  locale: Locale;
  unit: Unit;
  done: ReadonlySet<string>;
  recommended: boolean;
}) {
  const t = copy[locale];
  const Icon = UNIT_ICON[unit.key];
  const drills = drillsInUnit(unit.key);
  const finished = drills.filter((drill) => done.has(drill.id)).length;

  return (
    <section className={cn("flex flex-col rounded-2xl border bg-card p-5", recommended && "border-brand/50")}>
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            recommended ? "bg-brand/15 text-brand" : "bg-foreground/5 text-muted-foreground",
          )}
        >
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 font-semibold">
            {unit.title[locale]}
            {recommended ? (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand">
                {t.yourFocus}
              </span>
            ) : null}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <span className="block h-full rounded-full bg-brand" style={{ width: `${(finished / drills.length) * 100}%` }} />
            </span>
            <span className="text-xs text-muted-foreground">
              {finished}/{drills.length}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{unit.lesson[locale]}</p>
      <ol className="mt-3 flex flex-col">
        {drills.map((drill) => (
          <li key={drill.id}>
            <Link
              href={`/dashboard/training/${drill.id}`}
              className="group flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm transition-colors hover:text-brand"
            >
              <DoneMark done={done.has(drill.id)} />
              <span className="flex-1">{drill.title[locale]}</span>
              {drill.kind === "choose" ? <span className="text-xs text-muted-foreground">{t.quickPick}</span> : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function DoneMark({ done }: { done: boolean }) {
  return done ? (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-400">
      <Check className="size-3" />
    </span>
  ) : (
    <span className="size-5 shrink-0 rounded-full border-2 border-foreground/20" />
  );
}
