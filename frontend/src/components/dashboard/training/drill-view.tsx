"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
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
import { checkDrillAnswer, type DrillCheck } from "@/lib/training/check";
import type { ChoiceDrill, Drill, RewriteDrill, Unit } from "@/lib/training/drills";
import { DAILY_GOAL, type TrainingProgress } from "@/lib/training/progress";
import { askDrillCoach, completeDrill } from "@/lib/training-client";
import { cn } from "@/lib/utils";
import type { FeedbackLanguage } from "@/types/essay";
import type { DrillFeedback } from "@/types/training";

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
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const recorded = useRef(false);
  const Icon = UNIT_ICON[unit.key];

  async function markDone() {
    if (recorded.current) return;
    recorded.current = true;
    try {
      setProgress(await completeDrill(drill.id));
    } catch (error) {
      recorded.current = false;
      toast.error(describeApiError(error, "Couldn't save your progress."));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Link href="/dashboard/training" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Training
        </Link>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon className="size-4" />
          {position ? `${unit.title} · drill ${position.index} of ${position.total}` : `From your essay · ${unit.title}`}
        </span>
      </div>

      <p className="flex items-start gap-2.5 rounded-xl border bg-muted/40 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-400" />
        {unit.lesson}
      </p>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{drill.title}</h1>
        <p className="mt-2 text-[15px] leading-relaxed">{drill.task}</p>
        {drill.source ? (
          <blockquote className="mt-4 whitespace-pre-line border-l-2 border-brand/60 bg-muted/40 py-2.5 pr-3 pl-4 font-heading text-[15px] leading-relaxed text-foreground/90">
            {essayTitle ? <span className="mb-1 block text-xs font-sans text-muted-foreground">From “{essayTitle}”</span> : null}
            {drill.source}
          </blockquote>
        ) : null}

        {drill.kind === "rewrite" ? (
          <RewriteExercise drill={drill} initialCoachLeft={initialCoachLeft} onPassed={markDone} />
        ) : (
          <ChoiceExercise drill={drill} onCorrect={markDone} />
        )}
      </section>

      {progress ? <DoneBanner progress={progress} nextHref={nextHref} fromEssay={Boolean(essayTitle)} /> : null}

      {!progress && nextHref ? (
        <div className="text-center">
          <Link href={nextHref} className="text-sm text-muted-foreground hover:text-foreground">
            Skip for now
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function RewriteExercise({
  drill,
  initialCoachLeft,
  onPassed,
}: {
  drill: RewriteDrill;
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
  const [language, setLanguage] = useState<FeedbackLanguage>("en");

  const words = countWords(answer);

  function handleCheck() {
    if (words < 3) {
      setError("Write your attempt first.");
      setCheck(null);
      return;
    }
    const result = checkDrillAnswer(drill.rules, answer, drill.source);
    setCheck(result);
    if (result.done) onPassed();
  }

  async function handleCoach() {
    if (words < 3) {
      setError("Write your attempt first — the coach reviews what you wrote.");
      return;
    }
    setCoaching(true);
    try {
      const response = await askDrillCoach({ drill_id: drill.id, answer, language });
      setFeedback(response.feedback);
      setCoachLeft(response.left);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setCoachLeft(0);
      toast.error(describeApiError(err, "The AI coach didn't answer. Please try again."));
    } finally {
      setCoaching(false);
    }
  }

  return (
    <div className="mt-5 flex flex-col gap-4">
      <div>
        <Textarea
          value={answer}
          onChange={(event) => {
            setAnswer(event.target.value);
            setError(null);
          }}
          rows={4}
          placeholder={drill.placeholder}
          aria-label="Your rewrite"
          aria-invalid={Boolean(error)}
          className="min-h-28 text-[15px] leading-relaxed md:text-[15px]"
        />
        <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
          <span className="text-rose-400">{error}</span>
          <span className="text-muted-foreground">{words} words</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCheck}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
        >
          <Check className="size-4" />
          Check
        </button>
        <button
          type="button"
          onClick={() => setShowModel((v) => !v)}
          className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
        >
          <Eye className="size-4" />
          {showModel ? "Hide example" : "Show an example"}
        </button>
        <button
          type="button"
          onClick={handleCoach}
          disabled={coaching || coachLeft <= 0}
          className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          title={coachLeft <= 0 ? "AI coach notes refill tomorrow" : undefined}
        >
          {coaching ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          AI coach · {coachLeft} of {AI_COACH_PER_DAY} left
        </button>
        <div className="ml-auto flex rounded-full border p-0.5 text-xs font-semibold" aria-label="Coach language">
          {(["en", "ru"] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguage(code)}
              aria-pressed={language === code}
              className={cn(
                "rounded-full px-2.5 py-0.5 transition-colors",
                language === code ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {code === "en" ? "EN" : "RU"}
            </button>
          ))}
        </div>
      </div>

      {check ? <CheckResults check={check} /> : null}
      {feedback ? <CoachNote feedback={feedback} /> : null}
      {showModel ? <ModelAnswer drill={drill} /> : null}
    </div>
  );
}

function CheckResults({ check }: { check: DrillCheck }) {
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
        {check.done
          ? "All checks passed."
          : `${check.passed} of ${check.results.length} checks passed — fix the rest and check again.`}{" "}
        Instant rule-based check, no AI — a guide, not a grade.
      </p>
    </div>
  );
}

const VERDICT = {
  strong: { label: "Strong", className: "bg-emerald-400/15 text-emerald-400" },
  close: { label: "Almost there", className: "bg-amber-400/15 text-amber-400" },
  not_yet: { label: "Not yet", className: "bg-rose-400/15 text-rose-400" },
} as const;

function CoachNote({ feedback }: { feedback: DrillFeedback }) {
  const verdict = VERDICT[feedback.verdict];
  return (
    <div className="rounded-xl border p-4 text-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-brand" />
        <span className="font-semibold">AI coach</span>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", verdict.className)}>{verdict.label}</span>
      </div>
      <p className="mt-2.5 leading-relaxed">
        <span className="font-medium">What works: </span>
        {feedback.works}
      </p>
      <p className="mt-1.5 leading-relaxed">
        <span className="font-medium">Next step: </span>
        {feedback.fix}
      </p>
      {feedback.better_phrase ? (
        <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 font-heading text-[15px]">“{feedback.better_phrase}”</p>
      ) : null}
    </div>
  );
}

function ModelAnswer({ drill }: { drill: Drill }) {
  return (
    <div className="rounded-xl border border-dashed p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">One strong version</p>
      <p className="mt-2 font-heading text-[15px] leading-relaxed">{drill.model}</p>
      <p className="mt-2 text-[13px] text-muted-foreground">{drill.modelWhy}</p>
    </div>
  );
}

function ChoiceExercise({ drill, onCorrect }: { drill: ChoiceDrill; onCorrect: () => void }) {
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
                <span className="block font-heading text-[15px] leading-relaxed">{option.text}</span>
                {reveal ? <span className="mt-1.5 block text-[13px] text-muted-foreground">{option.why}</span> : null}
              </span>
            </span>
          </button>
        );
      })}
      {picked !== null && !solved ? (
        <p className="text-sm text-muted-foreground">Not quite — read why, then pick again.</p>
      ) : null}
    </div>
  );
}

function DoneBanner({
  progress,
  nextHref,
  fromEssay,
}: {
  progress: TrainingProgress;
  nextHref: string | null;
  fromEssay: boolean;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 sm:flex-row sm:items-center">
      <CircleCheck className="size-7 shrink-0 text-emerald-400" />
      <div className="flex-1">
        <p className="font-semibold">Drill done</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-amber-400" />
            {progress.streak} day streak
          </span>
          <span>
            Today {Math.min(progress.today, DAILY_GOAL)}/{DAILY_GOAL}
            {progress.today >= DAILY_GOAL ? " — goal reached" : ""}
          </span>
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {fromEssay ? null : (
          <Link href="/dashboard/essays" className="nav-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold">
            Try it on my essay
          </Link>
        )}
        <Link
          href={nextHref ?? "/dashboard/training"}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-5 py-2 text-sm font-semibold text-white shadow-glow-brand transition-transform hover:scale-105"
        >
          {nextHref ? "Next drill" : "Back to training"}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
