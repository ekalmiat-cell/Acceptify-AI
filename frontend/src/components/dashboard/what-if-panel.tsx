"use client";

import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Sparkles, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_SCALE_MAX, academicBenchmark } from "@/lib/benchmarks";
import {
  ACADEMIC_CRITERIA,
  ACADEMIC_CRITERION_LABELS,
  ACHIEVEMENT_CRITERIA,
  type AcademicCriterionKey,
  type AchievementCriterionKey,
} from "@/lib/criteria";
import {
  academicValue,
  predictMatch,
  withAcademicValue,
  type CriterionWeights,
  type StudentProfileInput,
} from "@/lib/predict";
import { planToTarget, simulateLevers } from "@/lib/what-if";
import type { University } from "@/types/domain";

/** Slider granularity per scale — a GPA that moves in whole points and an
 * IELTS that moves in tenths would both be untrue to the exam. */
const STEP: Record<AcademicCriterionKey, number> = {
  gpa: 0.05,
  sat: 10,
  act: 1,
  ielts: 0.5,
  toefl: 1,
  ent: 1,
};

function format(criterion: AcademicCriterionKey, value: number): string {
  if (criterion === "gpa") return value.toFixed(2);
  if (criterion === "ielts") return value.toFixed(1);
  return String(Math.round(value));
}

const achievementLabels = new Map(achievementCatalog.map((item) => [item.id, item.label]));

/**
 * "What would change my score, and by how much?" — answered by running the
 * real engine on a hypothetical profile rather than by a second model that
 * could disagree with the first (see `lib/what-if.ts`).
 *
 * The draft profile never leaves this component. Nothing here writes to the
 * student's saved profile: a what-if that silently edited the thing it was
 * asking about would be a trap.
 */
export function WhatIfPanel({
  university,
  profile,
  weights,
}: {
  university: University;
  profile: StudentProfileInput;
  weights: CriterionWeights;
}) {
  const [draft, setDraft] = useState<StudentProfileInput>(profile);

  const baseline = useMemo(
    () => predictMatch(university, profile, weights).score,
    [university, profile, weights]
  );
  const current = useMemo(
    () => predictMatch(university, draft, weights).score,
    [university, draft, weights]
  );

  /** Suggestions are computed against the *draft*, so the list keeps
   * answering "what's worth doing next" as the student explores. */
  const levers = useMemo(
    () => simulateLevers(university, draft, weights, { limit: 5 }),
    [university, draft, weights]
  );

  /** The next round number worth aiming at. Targets below the student's
   * current score would produce an empty plan and read as a joke. */
  const target = useMemo(() => {
    const rungs = [50, 60, 70, 80, 90];
    return rungs.find((rung) => rung > baseline) ?? Math.min(baseline + 5, 98);
  }, [baseline]);

  /** Planned from the saved profile, not the draft: this is the answer to
   * "what do I actually have to do", which doesn't change because someone
   * dragged a slider. */
  const plan = useMemo(
    () => planToTarget(university, profile, weights, target),
    [university, profile, weights, target]
  );

  const delta = current - baseline;
  const isDirty = delta !== 0 || draft !== profile;

  /** Only criteria this programme actually weights, and only those with a
   * bar to clear — the rest cannot move the score, and offering them would
   * invite work that provably does nothing. */
  const academicRows = ACADEMIC_CRITERIA.filter(
    (criterion) => (weights[criterion] ?? 0) > 0 && academicBenchmark(criterion, university)
  );

  const achievementRows = ACHIEVEMENT_CRITERIA.filter(
    (criterion) => (weights[criterion] ?? 0) > 0
  ).sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));

  function setAcademic(criterion: AcademicCriterionKey, value: number | null) {
    setDraft((previous) => withAcademicValue(criterion, value, previous));
  }

  function toggleAchievement(criterion: AchievementCriterionKey) {
    setDraft((previous) => ({
      ...previous,
      achievements: {
        ...previous.achievements,
        [criterion]: !previous.achievements[criterion],
      },
    }));
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Sparkles className="size-4" />
            </span>
            What if
          </CardTitle>
          <CardDescription>
            Move a score or add an achievement to see what it does to your fit at{" "}
            {university.shortName}. Nothing here changes your saved profile.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm text-muted-foreground">{baseline}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span className="font-heading text-3xl font-semibold text-foreground">{current}</span>
              <span className="text-xs text-muted-foreground">fit score / 100</span>
            </div>
            <div className="flex items-center gap-2">
              {delta !== 0 ? (
                <Badge
                  variant="outline"
                  className={
                    delta > 0
                      ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : "border-rose-500/30 text-rose-600 dark:text-rose-400"
                  }
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </Badge>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDraft(profile)}
                disabled={!isDirty}
              >
                <RotateCcw />
                Reset
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {academicRows.map((criterion) => {
              const value = academicValue(criterion, draft);
              const original = academicValue(criterion, profile);
              const benchmark = academicBenchmark(criterion, university);
              const max = ACADEMIC_SCALE_MAX[criterion];

              if (value == null) {
                return (
                  <div
                    key={criterion}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div>
                      <span className="font-medium">{ACADEMIC_CRITERION_LABELS[criterion]}</span>
                      <span className="ml-2 text-xs text-muted-foreground">not on your profile</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAcademic(criterion, Math.min(benchmark?.value ?? max / 2, max))
                      }
                    >
                      Try a score
                    </Button>
                  </div>
                );
              }

              return (
                <div key={criterion} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ACADEMIC_CRITERION_LABELS[criterion]}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm">{format(criterion, value)}</span>
                      {original != null && value !== original ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          was {format(criterion, original)}
                        </span>
                      ) : null}
                      {original == null ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setAcademic(criterion, null)}
                        >
                          clear
                        </Button>
                      ) : null}
                    </span>
                  </div>
                  <Slider
                    value={[value]}
                    min={0}
                    max={max}
                    step={STEP[criterion]}
                    onValueChange={(next) =>
                      setAcademic(criterion, Array.isArray(next) ? next[0] : next)
                    }
                  />
                  {benchmark ? (
                    <span className="text-xs text-muted-foreground">
                      {university.shortName}: {benchmark.label}
                      {benchmark.source === "national" ? " (national baseline)" : ""}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {achievementRows.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Achievements this programme weights</p>
              <div className="flex flex-wrap gap-2">
                {achievementRows.map((criterion) => {
                  const on = Boolean(draft.achievements[criterion]);
                  const owned = Boolean(profile.achievements[criterion]);
                  return (
                    <button
                      key={criterion}
                      type="button"
                      onClick={() => toggleAchievement(criterion)}
                      className={
                        on
                          ? "rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand"
                          : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-brand/40 hover:text-foreground"
                      }
                    >
                      {achievementLabels.get(criterion) ?? criterion}
                      <span className="ml-1.5 opacity-60">{weights[criterion]}</span>
                      {owned ? <span className="ml-1 opacity-60">·&nbsp;yours</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </span>
            Cheapest path to {target}
          </CardTitle>
          <CardDescription>
            {plan.reached
              ? `${plan.steps.length} step${plan.steps.length === 1 ? "" : "s"}, roughly ${plan.totalEffortWeeks} weeks of work.`
              : `Every worthwhile action taken together reaches ${plan.to}. This university may simply be a reach.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {plan.steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing on this programme&apos;s evaluation model would move your score right
              now — you are already scoring on everything it weights.
            </p>
          ) : (
            <ol className="flex flex-col gap-3">
              {plan.steps.map((step, index) => (
                <li key={step.id} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-semibold">
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-xs text-muted-foreground">{step.detail}</span>
                  </div>
                  <span className="ml-auto shrink-0 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    +{step.delta}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {levers.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-sm font-medium">Biggest single wins</p>
              {levers.map((lever) => (
                <button
                  key={lever.id}
                  type="button"
                  onClick={() => setDraft(lever.profile)}
                  className="flex items-center gap-2 rounded-lg border border-border p-2 text-left transition-colors hover:border-brand/40"
                >
                  <span className="min-w-0 flex-1 truncate text-xs">{lever.label}</span>
                  <span className="shrink-0 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    +{lever.delta}
                  </span>
                </button>
              ))}
              <p className="text-xs text-muted-foreground">
                Ranked by points gained; the plan above re-ranks them by points per week of
                work.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
