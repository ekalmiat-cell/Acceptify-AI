import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Trophy,
  Percent,
  Wallet,
  CalendarClock,
  MapPin,
  GraduationCap,
  Award,
  Sparkles,
  Gauge,
  Globe,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import { AcceptanceTrendChart } from "@/components/dashboard/acceptance-trend-chart";
import { RequirementsGap } from "@/components/dashboard/requirements-gap";
import { UniversityActions } from "@/components/dashboard/university-actions";
import { SetDreamUniversityButton } from "@/components/dashboard/set-dream-university-button";
import { MatchBadge } from "@/components/shared/match-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUniversityBySlug } from "@/lib/universities";
import { getUniversities } from "@/lib/universities-server";
import { predictMatch } from "@/lib/predict";
import type { CriterionWeights } from "@/lib/predict";
import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { getEvaluationProfile } from "@/lib/programs-server";
import { hasAnyAcademicProfile, resolveAchievements, toStudentProfileInput } from "@/lib/profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const universities = await getUniversities();
  const university = getUniversityBySlug(universities, slug);
  return { title: university?.name ?? "University" };
}

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [academic, records, universities] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);
  const university = getUniversityBySlug(universities, slug);

  if (!university) {
    notFound();
  }

  const hasProfile = hasAnyAcademicProfile(academic);
  const profile = hasProfile ? toStudentProfileInput(academic, resolveAchievements(records)) : null;

  let weights: CriterionWeights = DEFAULT_WEIGHTS;
  if (academic.dreamUniversityId === university.id && academic.dreamProgramId) {
    const evaluationProfile = await getEvaluationProfile(academic.dreamProgramId);
    if (evaluationProfile) {
      weights = Object.fromEntries(
        evaluationProfile.weights.map((w) => [w.criterionKey, w.weight])
      ) as CriterionWeights;
    }
  }

  const match = profile ? predictMatch(university, profile, weights) : null;

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{
          background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-base font-semibold text-white backdrop-blur-sm">
              {university.logoInitials}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {university.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/15 text-white">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-white sm:text-3xl">
                {university.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                <MapPin className="size-3.5" />
                {university.city}, {university.country}
              </p>
            </div>
          </div>

          {match ? (
            <div className="flex flex-col items-start gap-2 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:items-end">
              <MatchBadge category={match.category} className="bg-white/90" />
              <p className="font-heading text-3xl font-semibold text-white">
                {match.score}%<span className="ml-1 text-sm font-normal text-white/70">match</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:items-end">
              <p className="text-sm text-white/85">Complete your profile to see your match score</p>
              <Button render={<Link href="/dashboard/profile" />} size="sm" variant="secondary">
                <Sparkles />
                Complete profile
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">{university.description}</p>
        <div className="flex flex-wrap items-center gap-2">
          <SetDreamUniversityButton academic={academic} universityId={university.id} />
          <UniversityActions universityName={university.shortName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="World ranking" value={`#${university.worldRanking}`} icon={Trophy} accent="brand" />
        {university.nationalRanking ? (
          <StatCard label="National ranking" value={`#${university.nationalRanking}`} icon={Gauge} accent="amber" />
        ) : null}
        <StatCard label="Acceptance rate" value={`${university.acceptanceRate}%`} icon={Percent} accent="amber" />
        <StatCard label="Selectivity" value={university.selectivityLevel} icon={Gauge} accent="rose" />
        <StatCard
          label="Tuition / year"
          value={university.tuitionPerYearUsd === 0 ? "Fully funded" : `$${university.tuitionPerYearUsd.toLocaleString("en-US")}`}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard label="Deadline" value={university.applicationDeadline} icon={CalendarClock} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <AcceptanceTrendChart data={university.acceptRateTrend} />

          <Card>
            <CardHeader>
              <CardTitle>Admission requirements</CardTitle>
              <CardDescription>What this university asks every applicant for</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {university.requirements.map((req) => (
                  <div key={req.label} className="rounded-lg border border-border p-3">
                    <dt className="text-xs text-muted-foreground">{req.label}</dt>
                    <dd className="mt-1 text-sm font-medium">{req.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {profile ? (
            <RequirementsGap university={university} profile={profile} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Requirements gap</CardTitle>
                <CardDescription>Your profile vs. this university&apos;s stated bar</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Add at least one academic score (GPA, SAT, IELTS, TOEFL, ACT, or ENT) to compare against this university.
                </p>
                <Button render={<Link href="/dashboard/profile" />} size="sm">
                  Complete your profile
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-4 text-brand" />
                Scholarships
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium">
                {university.scholarshipAvailable ? "Available" : "Not available"}
              </p>
              <p className="text-sm text-muted-foreground">{university.scholarshipCoverage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4 text-brand" />
                Decision details
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Decision type</span>
                <span className="font-medium">{university.decisionType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium">{university.applicationDeadline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Living cost / year</span>
                <span className="font-medium">${university.livingCostPerYearUsd.toLocaleString("en-US")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Website</span>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  <Globe className="size-3.5" />
                  Visit site
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
