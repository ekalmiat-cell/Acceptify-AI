import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Sparkles, Target, ShieldCheck, Flame } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { MatchTrendChart } from "@/components/dashboard/match-trend-chart";
import { PredictionHistoryList } from "@/components/dashboard/prediction-history-list";
import { OutcomeReminder } from "@/components/dashboard/outcome-reminder";
import { RecommendationsList } from "@/components/dashboard/recommendations-list";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { QuickStatusRow } from "@/components/dashboard/quick-status-row";
import { getPredictionHistory } from "@/lib/predictions-server";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { computeProfileCompleteness, resolveAchievements } from "@/lib/profile";
import { getUniversityById } from "@/lib/universities";
import { getUniversities } from "@/lib/universities-server";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Dashboard",
    welcome: (name: string) => `Welcome back, ${name}`,
    there: "there",
    subtitle: "Here's where your applications stand today.",
    run: "Run new prediction",
    average: "Average fit score",
    safe: "Safe schools",
    target: "Target schools",
    reach: "Reach schools",
  },
  ru: {
    title: "Обзор",
    welcome: (name: string) => `С возвращением, ${name}`,
    there: "друг",
    subtitle: "Вот как сейчас обстоят дела с твоими заявками.",
    run: "Новый прогноз",
    average: "Средний балл соответствия",
    safe: "Надёжные",
    target: "Целевые",
    reach: "Амбициозные",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

export default async function DashboardOverviewPage() {
  const t = copy[await getLocale()];
  const [session, predictionHistory, academic, achievementRecords, universities] = await Promise.all([
    auth.api.getSession({ headers: await headers() }).catch(() => null),
    getPredictionHistory(),
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);
  const safeAcademic = academic ?? {
    gpa: null,
    satScore: null,
    actScore: null,
    ieltsScore: null,
    toeflScore: null,
    entScore: null,
    dreamUniversityId: null,
    dreamProgramId: null,
  };
  const safePredictions = Array.isArray(predictionHistory) ? predictionHistory : [];
  const safeAchievements = Array.isArray(achievementRecords) ? achievementRecords : [];
  const safeUniversities = Array.isArray(universities) ? universities : [];

  const firstName = session?.user?.name?.split(" ")[0] ?? t.there;

  const profileCompleteness = computeProfileCompleteness(
    safeAcademic,
    resolveAchievements(safeAchievements)
  );
  const dreamUniversity = safeAcademic.dreamUniversityId
    ? (getUniversityById(safeUniversities, safeAcademic.dreamUniversityId) ?? null)
    : null;

  const safeCount = safePredictions.filter((p) => p.category === "safe").length;
  const targetCount = safePredictions.filter((p) => p.category === "target").length;
  const reachCount = safePredictions.filter((p) => p.category === "reach").length;
  const avgScore =
    safePredictions.length > 0
      ? Math.round(
          safePredictions.reduce((sum, p) => sum + p.matchScore, 0) / safePredictions.length
        )
      : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">
            {t.welcome(firstName)}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle}</p>
        </div>
        <Button render={<Link href="/dashboard/universities" />} className="bg-gradient-brand text-white hover:opacity-90">
          <Sparkles />
          {t.run}
        </Button>
      </div>

      <QuickStatusRow
        profileCompleteness={profileCompleteness}
        dreamUniversity={dreamUniversity}
        reportsCount={safePredictions.length}
      />

      <OutcomeReminder predictions={safePredictions} universities={safeUniversities} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t.average} value={`${avgScore}/100`} icon={Sparkles} accent="brand" />
        <StatCard label={t.safe} value={String(safeCount)} icon={ShieldCheck} accent="emerald" />
        <StatCard label={t.target} value={String(targetCount)} icon={Target} accent="amber" />
        <StatCard label={t.reach} value={String(reachCount)} icon={Flame} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <MatchTrendChart predictions={safePredictions} />
        </div>
        <ProfileProgressCard />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PredictionHistoryList predictions={safePredictions} universities={safeUniversities} />
        </div>
        <RecommendationsList />
      </div>
    </div>
  );
}
