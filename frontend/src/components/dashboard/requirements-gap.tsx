"use client";

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
import { criterionName } from "@/lib/catalog-copy";
import { ACADEMIC_CRITERIA } from "@/lib/criteria";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    vs: "vs.",
    title: "Requirements gap",
    subtitle: "Your profile vs. this university's stated bar — or, where it states none, the national level the score falls back to",
    none: "This university states no entry requirements that overlap with the scores on your profile.",
    national: "national baseline",
  },
  ru: {
    vs: "против",
    title: "Разрыв с требованиями",
    subtitle: "Твой профиль против заявленной планки университета — или, если её нет, против национального уровня",
    none: "Университет не указывает требований, которые пересекаются с баллами в твоём профиле.",
    national: "национальный уровень",
  },
});

export function RequirementsGap({
  university,
  profile,
}: {
  university: University;
  profile: StudentProfileInput;
}) {
  const locale = useLocale();
  const t = copy[locale];
  /**
   * Bars come from `lib/benchmarks.ts`, the same resolver the scoring engine
   * divides by — so this card can never tell a student they clear a bar the
   * score is penalising them for missing. A criterion with no bar at all
   * (the catalog stores an unstated requirement as `0`) is left out
   * entirely rather than shown as passed.
   */
  const checks = ACADEMIC_CRITERIA.map((criterion) => {
    const value = academicValue(criterion, profile);
    const benchmark = academicBenchmark(criterion, university, locale);
    if (value == null || !benchmark) return null;

    const precise = criterion === "gpa" || criterion === "ielts";

    return {
      label: criterionName(criterion, locale),
      met: value >= benchmark.value,
      detail: `${precise ? value.toFixed(criterion === "gpa" ? 2 : 1) : value} ${t.vs} ${benchmark.label}`,
      /** Stated by this university, or a national level standing in for one.
       * Shown because "below their minimum" and "below a competitive score"
       * are different things to be told. */
      source: benchmark.source,
    };
  }).filter((check) => check !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {checks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">{t.none}</p>
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
                  {t.national}
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
