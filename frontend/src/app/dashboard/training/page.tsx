import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainingHome } from "@/components/dashboard/training/training-home";
import {
  drillsFromReview,
  getLatestReview,
  getTrainingProgress,
  weakestCriterion,
} from "@/lib/data/training";
import { CRITERION_KEYS, type CriterionKey } from "@/lib/essay-rubric";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentUserId } from "@/lib/session";
import { orderedUnits } from "@/lib/training/drills";

const copy = defineCopy({
  en: { title: "Training", description: "Short essay-writing drills, one skill at a time, checked instantly." },
  ru: { title: "Тренировка", description: "Короткие упражнения по эссе, по одному навыку, с мгновенной проверкой." },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = copy[await getLocale()];
  return { title: t.title, description: t.description };
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?redirect=/dashboard/training");

  const [{ focus: focusParam }, progress, latest, locale] = await Promise.all([
    searchParams,
    getTrainingProgress(userId),
    getLatestReview(userId),
    getLocale(),
  ]);

  // "Train this" from a review names the criterion; otherwise start with the
  // weakest one in the latest review.
  const asked = CRITERION_KEYS.find((key) => key === focusParam) as CriterionKey | undefined;
  const weakest = latest ? weakestCriterion(latest.analysis) : null;
  const focus = asked
    ? { criterion: asked, score: latest ? latest.analysis.criteria[asked].score : null }
    : weakest
      ? { criterion: weakest.key, score: weakest.score }
      : null;

  return (
    <TrainingHome
      locale={locale}
      units={orderedUnits(focus?.criterion ?? null)}
      progress={progress}
      personal={drillsFromReview(latest)}
      essayTitle={latest?.title ?? null}
      focus={focus}
    />
  );
}
