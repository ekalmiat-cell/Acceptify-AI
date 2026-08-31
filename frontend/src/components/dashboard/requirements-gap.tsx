import { Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { academicValue } from "@/lib/predict";
import type { StudentProfileInput } from "@/lib/predict";
import { academicBenchmark } from "@/lib/benchmarks";
import { ACADEMIC_CRITERIA, ACADEMIC_CRITERION_LABELS } from "@/lib/criteria";
import type { University } from "@/types/domain";

export function RequirementsGap({
  university,
  profile,
}: {
  university: University;
  profile: StudentProfileInput;
}) {
  /**
   * Bars come from `lib/benchmarks.ts`, the same resolver the scoring engine
   * divides by — so this card can never tell a student they clear a bar the
   * score is penalising them for missing. A criterion with no bar at all
   * (the catalog stores an unstated requirement as `0`) is left out
   * entirely rather than shown as passed.
   */
  const checks = ACADEMIC_CRITERIA.map((criterion) => {
    const value = academicValue(criterion, profile);
    const benchmark = academicBenchmark(criterion, university);
    if (value == null || !benchmark) return null;

    const precise = criterion === "gpa" || criterion === "ielts";

    return {
      label: ACADEMIC_CRITERION_LABELS[criterion],
      met: value >= benchmark.value,
      detail: `${precise ? value.toFixed(criterion === "gpa" ? 2 : 1) : value} vs. ${benchmark.label}`,
      /** Stated by this university, or a national level standing in for one.
       * Shown because "below their minimum" and "below a competitive score"
       * are different things to be told. */
      source: benchmark.source,
    };
  }).filter((check) => check !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requirements gap</CardTitle>
        <CardDescription>
          Your profile vs. this university&apos;s stated bar — or, where it states
          none, the national level the score falls back to
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {checks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            This university states no entry requirements that overlap with the
            scores on your profile.
          </p>
        ) : null}
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={
                  check.met
                    ? "flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "flex size-6 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }
              >
                {check.met ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <span className="text-sm font-medium">{check.label}</span>
              {check.source === "national" ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                  national baseline
                </span>
              ) : null}
            </div>
            <span className="font-mono text-xs text-muted-foreground">{check.detail}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
