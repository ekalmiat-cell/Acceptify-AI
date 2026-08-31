import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Sparkles, Target, ShieldCheck, Flame } from "lucide-react";

import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { MatchTrendChart } from "@/components/dashboard/match-trend-chart";
import { PredictionHistoryList } from "@/components/dashboard/prediction-history-list";
import { RecommendationsList } from "@/components/dashboard/recommendations-list";
import { ProfileProgressCard } from "@/components/dashboard/profile-progress-card";
import { QuickStatusRow } from "@/components/dashboard/quick-status-row";
import { getPredictionHistory } from "@/lib/predictions-server";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { computeProfileCompleteness, resolveAchievements } from "@/lib/profile";
import { getUniversityById } from "@/lib/universities";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardOverviewPage() {
  const [session, predictionHistory, academic, achievementRecords, universities] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
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

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s where your applications stand today.
          </p>
        </div>
        <Button render={<Link href="/dashboard/universities" />} className="bg-gradient-brand text-white hover:opacity-90">
          <Sparkles />
          Run new prediction
        </Button>
      </div>

      <QuickStatusRow
        profileCompleteness={profileCompleteness}
        dreamUniversity={dreamUniversity}
        reportsCount={predictionHistory.length}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average fit score" value={`${avgScore}/100`} icon={Sparkles} accent="brand" />
        <StatCard label="Safe schools" value={String(safeCount)} icon={ShieldCheck} accent="emerald" />
        <StatCard label="Target schools" value={String(targetCount)} icon={Target} accent="amber" />
        <StatCard label="Reach schools" value={String(reachCount)} icon={Flame} accent="rose" />
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
