"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  Check,
  CircleCheck,
  Eye,
  Flame,
  Lightbulb,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

import { UNIT_ICON } from "@/components/dashboard/training/unit-icons";
import { Textarea } from "@/components/ui/textarea";
import { AI_COACH_PER_DAY } from "@/lib/ai-limits";
import { ApiError, describeApiError } from "@/lib/api-error";
import { countWords } from "@/lib/essay-check";
import { defineCopy, plural, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { checkDrillAnswer, type DrillCheck } from "@/lib/training/check";
import type { ChoiceDrill, Drill, RewriteDrill, Unit } from "@/lib/training/drills";
import { DAILY_GOAL, type TrainingProgress } from "@/lib/training/progress";
import { askDrillCoach, completeDrill } from "@/lib/training-client";
import { cn } from "@/lib/utils";
import type { DrillFeedback } from "@/types/training";

const copy = defineCopy({
  en: {
    exit: "Exit the drill",
    position: (unit: string, index: number, total: number) => `${unit} · drill ${index} of ${total}`,
    fromEssayPosition: (unit: string) => `From your essay · ${unit}`,
    from: (title: string) => `From “${title}”`,
    saveFailed: "Couldn't save your progress.",
    skip: "Skip for now",
    yourRewrite: "Your rewrite (in English)",
    writeFirst: "Write your attempt first.",
    writeFirstCoach: "Write your attempt first — the coach reviews what you wrote.",
    words: (n: number) => `${n} word${n === 1 ? "" : "s"}`,
    check: "Check",
    showExample: "Show an example",
    hideExample: "Hide example",
    coach: (left: number, total: number) => `AI coach · ${left} of ${total} left`,
    coachRefills: "AI coach notes refill tomorrow",
    coachFailed: "The AI coach didn't answer. Please try again.",
    allPassed: "All checks passed.",
    somePassed: (passed: number, total: number) => `${passed} of ${total} checks passed — fix the rest and check again.`,
    ruleNote: "Instant rule-based check, no AI — a guide, not a grade.",
    verdicts: { strong: "Strong", close: "Almost there", not_yet: "Not yet" },
    aiCoach: "AI coach",
    works: "What works:",
    nextStep: "Next step:",
    oneVersion: "One strong version",
    notQuite: "Not quite — read why, then pick again.",
    drillDone: "Drill done",
    streak: (n: number) => `${n} day${n === 1 ? "" : "s"} in a row`,
    today: (n: number, goal: number) => `Today ${n}/${goal}`,
    goalReached: " — goal reached",
    tryOnEssay: "Try it on my essay",
    nextDrill: "Next drill",
    backToTraining: "Back to training",
  },
  ru: {
    exit: "Выйти из упражнения",
    position: (unit: string, index: number, total: number) => `${unit} · упражнение ${index} из ${total}`,
    fromEssayPosition: (unit: string) => `Из твоего эссе · ${unit}`,
    from: (title: string) => `Из «${title}»`,
    saveFailed: "Не удалось сохранить прогресс.",
    skip: "Пропустить пока",
    yourRewrite: "Твой вариант (на английском)",
    writeFirst: "Сначала напиши свой вариант.",
    writeFirstCoach: "Сначала напиши свой вариант — тренер разбирает твой текст.",
    words: (n: number) => `${n} ${plural("ru", n, { one: "слово", few: "слова", many: "слов" })}`,
    check: "Проверить",
    showExample: "Показать пример",
    hideExample: "Скрыть пример",
    coach: (left: number, total: number) => `ИИ-тренер · осталось ${left} из ${total}`,
    coachRefills: "Отзывы ИИ-тренера обновятся завтра",
    coachFailed: "ИИ-тренер не ответил. Попробуй ещё раз.",
    allPassed: "Все проверки пройдены.",
    somePassed: (passed: number, total: number) =>
      `Пройдено ${passed} из ${total} — исправь остальное и проверь снова.`,
    ruleNote: "Мгновенная проверка по правилам, без ИИ — подсказка, а не оценка.",
    verdicts: { strong: "Сильно", close: "Почти", not_yet: "Пока нет" },
    aiCoach: "ИИ-тренер",
    works: "Что получилось:",
    nextStep: "Следующий шаг:",
    oneVersion: "Один из сильных вариантов",
    notQuite: "Не совсем — прочитай почему и выбери снова.",
    drillDone: "Упражнение выполнено",
    streak: (n: number) => `${n} ${plural("ru", n, { one: "день", few: "дня", many: "дней" })} подряд`,
    today: (n: number, goal: number) => `Сегодня ${n}/${goal}`,
    goalReached: " — цель выполнена",
    tryOnEssay: "Применить к своему эссе",
    nextDrill: "Следующее упражнение",
    backToTraining: "К тренировке",
  },
});

type Copy = (typeof copy)["en"];

export function DrillView({
  drill,
  unit,
  position,
  essayTitle,
  nextHref,
  initialCoachLeft,
}: {
  drill: Drill;
  unit: Unit;
  /** "Drill 3 of 5" within the unit; null for a drill from the student's essay. */
  position: { index: number; total: number } | null;
  essayTitle: string | null;
  nextHref: string | null;
  initialCoachLeft: number;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const recorded = useRef(false);
  const router = useRouter();
  const Icon = UNIT_ICON[unit.key];

  // A drill is a lesson: it takes the whole screen, like Duolingo's. The page
  // behind stops scrolling, and Esc leaves just like the cross does.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !(event.target instanceof HTMLTextAreaElement)) router.push("/dashboard/training");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  // Drills already done in this unit, this one included once it passes.
  const doneShare = position ? (position.index - 1 + (progress ? 1 : 0)) / position.total : progress ? 1 : 0;

  async function markDone() {
    if (recorded.current) return;
    recorded.current = true;
    try {
      setProgress(await completeDrill(drill.id));
    } catch (error) {
      recorded.current = false;
      toast.error(describeApiError(error, t.saveFailed));
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={drill.title[locale]} className="fixed inset-0 z-[60] overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-4 px-4 py-4">
          <Link
            href="/dashboard/training"
            title={t.exit}
            aria-label={t.exit}
            className="-ml-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-6" />
          </Link>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(doneShare * 100)}
            className="h-4 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="relative h-full rounded-full bg-[#58cc02] transition-[width] duration-700 ease-out"
              style={{ width: `${Math.max(doneShare * 100, 4)}%` }}
            >
              {/* The glossy streak along the top, as on Duolingo's bar. */}
              <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-white/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pt-2 pb-16">
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Icon className="size-4 shrink-0" />
          {position
            ? t.position(unit.title[locale], position.index, position.total)
            : t.fromEssayPosition(unit.title[locale])}
        </p>

        <p className="flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" />
          {unit.lesson[locale]}
        </p>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{drill.title[locale]}</h1>
          <p className="mt-2 text-[15px] leading-relaxed">{drill.task[locale]}</p>
          {drill.source ? (
            <blockquote
              lang="en"
              className="mt-4 whitespace-pre-line border-l-2 border-brand/60 bg-muted/40 py-2.5 pr-3 pl-4 font-heading text-[15px] leading-relaxed text-foreground/90"
            >
              {essayTitle ? (
                <span lang={locale} className="mb-1 block font-sans text-xs text-muted-foreground">
                  {t.from(essayTitle)}
                </span>
              ) : null}
              {drill.source}
            </blockquote>
          ) : null}

          {drill.kind === "rewrite" ? (
            <RewriteExercise drill={drill} locale={locale} t={t} initialCoachLeft={initialCoachLeft} onPassed={markDone} />
          ) : (
            <ChoiceExercise drill={drill} locale={locale} t={t} onCorrect={markDone} />
          )}
        </section>

        {progress ? <DoneBanner t={t} progress={progress} nextHref={nextHref} fromEssay={Boolean(essayTitle)} /> : null}

        {!progress && nextHref ? (
          <div className="text-center">
            <Link href={nextHref} className="text-sm text-muted-foreground hover:text-foreground">
              {t.skip}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function RewriteExercise({
  drill,
  locale,
  t,
  initialCoachLeft,
  onPassed,
}: {
  drill: RewriteDrill;
  locale: Locale;
  t: Copy;
  initialCoachLeft: number;
  onPassed: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [check, setCheck] = useState<DrillCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModel, setShowModel] = useState(false);
  const [coachLeft, setCoachLeft] = useState(initialCoachLeft);
  const [coaching, setCoaching] = useState(false);
  const [feedback, setFeedback] = useState<DrillFeedback | null>(null);

  const words = countWords(answer);

  function handleCheck() {
    if (words < 3) {
      setError(t.writeFirst);
      setCheck(null);
      return;
    }
    const result = checkDrillAnswer(drill.rules, answer, drill.source, locale);
    setCheck(result);
    if (result.done) onPassed();
  }

  async function handleCoach() {
    if (words < 3) {
      setError(t.writeFirstCoach);
      return;
    }
    setCoaching(true);
    try {
      const response = await askDrillCoach({ drill_id: drill.id, answer });
      setFeedback(response.feedback);
      setCoachLeft(response.left);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setCoachLeft(0);
      toast.error(describeApiError(err, t.coachFailed));
    } finally {
      setCoaching(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div>
        <Textarea
          lang="en"
          spellCheck
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError(null);
          }}
          rows={4}
          placeholder={drill.placeholder}
          aria-label={t.yourRewrite}
          aria-invalid={Boolean(error)}
          className="min-h-28 text-[15px] leading-relaxed md:text-[15px]"
        />
        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-rose-400">{error}</span>
          <span className="text-muted-foreground">{t.words(words)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCheck}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
        >
          <Check className="size-4" />
          {t.check}
        </button>
        <button
          type="button"
          onClick={() => setShowModel((v) => !v)}
          className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        >
          <Eye className="size-4" />
          {showModel ? t.hideExample : t.showExample}
        </button>
        <button
          type="button"
          onClick={handleCoach}
          disabled={coaching || coachLeft <= 0}
          className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          title={coachLeft <= 0 ? t.coachRefills : undefined}
        >
          {coaching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {t.coach(coachLeft, AI_COACH_PER_DAY)}
        </button>
      </div>

      {check ? <CheckResults t={t} check={check} /> : null}
      {feedback ? <CoachNote t={t} feedback={feedback} /> : null}
      {showModel ? <ModelAnswer t={t} locale={locale} drill={drill} /> : null}
    </div>
  );
}

function CheckResults({ t, check }: { t: Copy; check: DrillCheck }) {
  return (
    <div className={cn("rounded-xl border p-4", check.done ? "border-emerald-400/30 bg-emerald-400/5" : "")}>
      <ul className="flex flex-col gap-2">
        {check.results.map((result, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {result.ok ? (
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            ) : (
              <X className="mt-0.5 size-4 shrink-0 text-rose-400" />
            )}
            <span>
              {result.label}
              {result.hint ? <span className="block text-[13px] text-muted-foreground">{result.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        {check.done ? t.allPassed : t.somePassed(check.passed, check.results.length)} {t.ruleNote}
      </p>
    </div>
  );
}

const VERDICT_STYLE = {
  strong: "bg-emerald-400/15 text-emerald-400",
  close: "bg-amber-400/15 text-amber-400",
  not_yet: "bg-rose-400/15 text-rose-400",
} as const;

function CoachNote({ t, feedback }: { t: Copy; feedback: DrillFeedback }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-brand" />
        <span className="font-semibold">{t.aiCoach}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", VERDICT_STYLE[feedback.verdict])}>
          {t.verdicts[feedback.verdict]}
        </span>
      </div>
      <p className="mt-2.5 leading-relaxed">
        <span className="font-medium">{t.works} </span>
        {feedback.works}
      </p>
      <p className="mt-1.5 leading-relaxed">
        <span className="font-medium">{t.nextStep} </span>
        {feedback.fix}
      </p>
      {feedback.better_phrase ? (
        <p lang="en" className="mt-2 rounded-lg bg-muted/50 px-3 py-2 font-heading text-[15px]">
          “{feedback.better_phrase}”
        </p>
      ) : null}
    </div>
  );
}

function ModelAnswer({ t, locale, drill }: { t: Copy; locale: Locale; drill: Drill }) {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.oneVersion}</p>
      <p lang="en" className="mt-2 font-heading text-[15px] leading-relaxed">
        {drill.model}
      </p>
      <p className="mt-2 text-[13px] text-muted-foreground">{drill.modelWhy[locale]}</p>
    </div>
  );
}

function ChoiceExercise({
  drill,
  locale,
  t,
  onCorrect,
}: {
  drill: ChoiceDrill;
  locale: Locale;
  t: Copy;
  onCorrect: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const solved = picked !== null && drill.options[picked].correct;

  return (
    <div className="mt-5 flex flex-col gap-2.5">
      {drill.options.map((option, i) => {
        const chosen = picked === i;
        const reveal = chosen || (solved && option.correct);
        return (
          <button
            key={i}
            type="button"
            disabled={solved}
            onClick={() => {
              setPicked(i);
              if (option.correct) onCorrect();
            }}
            className={cn(
              "rounded-xl border p-4 text-left transition-colors enabled:hover:border-brand/50",
              reveal && option.correct && "border-emerald-400/50 bg-emerald-400/5",
              chosen && !option.correct && "border-rose-400/50 bg-rose-400/5",
            )}
          >
            <span className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-foreground/20 text-[11px]",
                  reveal && option.correct && "border-emerald-400 bg-emerald-400 text-white",
                  chosen && !option.correct && "border-rose-400 bg-rose-400 text-white",
                )}
              >
                {reveal && option.correct ? <Check className="size-3" /> : chosen ? <X className="size-3" /> : null}
              </span>
              <span className="min-w-0">
                <span lang="en" className="block font-heading text-[15px] leading-relaxed">
                  {option.text}
                </span>
                {reveal ? <span className="mt-1.5 block text-[13px] text-muted-foreground">{option.why[locale]}</span> : null}
              </span>
            </span>
          </button>
        );
      })}
      {picked !== null && !solved ? <p className="text-sm text-muted-foreground">{t.notQuite}</p> : null}
    </div>
  );
}

function DoneBanner({
  t,
  progress,
  nextHref,
  fromEssay,
}: {
  t: Copy;
  progress: TrainingProgress;
  nextHref: string | null;
  fromEssay: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 sm:flex-row sm:items-center">
      <CircleCheck className="size-7 shrink-0 text-emerald-400" />
      <div className="flex-1">
        <p className="font-semibold">{t.drillDone}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-amber-400" />
            {t.streak(progress.streak)}
          </span>
          <span>
            {t.today(Math.min(progress.today, DAILY_GOAL), DAILY_GOAL)}
            {progress.today >= DAILY_GOAL ? t.goalReached : ""}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {fromEssay ? null : (
          <Link href="/dashboard/essays" className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            {t.tryOnEssay}
          </Link>
        )}
        <Link
          href={nextHref ?? "/dashboard/training"}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
        >
          {nextHref ? t.nextDrill : t.backToTraining}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
