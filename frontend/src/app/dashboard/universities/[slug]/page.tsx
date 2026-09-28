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
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { resolveWeightsForUniversity } from "@/lib/weights-server";
import { hasAnyAcademicProfile, resolveAchievements, toStudentProfileInput } from "@/lib/profile";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { defineCopy, formatNumber } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import {
  deadlineText,
  decisionName,
  requirementText,
  scholarshipText,
  selectivityName,
  tagName,
  universityDescription,
} from "@/lib/university-copy";

const copy = defineCopy({
  en: {
    fallbackTitle: "University",
    match: "match",
    completeToSee: "Complete your profile to see your match score",
    completeProfile: "Complete profile",
    worldRanking: "World ranking",
    nationalRanking: "National ranking",
    acceptance: "Acceptance rate",
    selectivity: "Selectivity",
    tuition: "Tuition / year",
    fullyFunded: "Fully funded",
    deadline: "Deadline",
    requirements: "Admission requirements",
    requirementsNote: "What this university asks every applicant for",
    gap: "Requirements gap",
    gapNote: "Your profile vs. this university's stated bar",
    gapEmpty: "Add at least one academic score (GPA, SAT, IELTS, TOEFL, ACT, or ENT) to compare against this university.",
    completeYourProfile: "Complete your profile",
    scholarships: "Scholarships",
    available: "Available",
    notAvailable: "Not available",
    decision: "Decision details",
    decisionType: "Decision type",
    living: "Living cost / year",
    website: "Website",
    visit: "Visit site",
  },
  ru: {
    fallbackTitle: "Университет",
    match: "соответствие",
    completeToSee: "Заполни профиль, чтобы увидеть своё соответствие",
    completeProfile: "Заполнить профиль",
    worldRanking: "Мировой рейтинг",
    nationalRanking: "Национальный рейтинг",
    acceptance: "Доля принятых",
    selectivity: "Отбор",
    tuition: "Обучение в год",
    fullyFunded: "Полностью бесплатно",
    deadline: "Дедлайн",
    requirements: "Требования к поступлению",
    requirementsNote: "Что университет просит у каждого абитуриента",
    gap: "Разрыв с требованиями",
    gapNote: "Твой профиль против заявленной планки университета",
    gapEmpty: "Добавь хотя бы один балл (GPA, SAT, IELTS, TOEFL, ACT или ЕНТ), чтобы сравнить себя с этим университетом.",
    completeYourProfile: "Заполнить профиль",
    scholarships: "Стипендии",
    available: "Есть",
    notAvailable: "Нет",
    decision: "Детали приёма",
    decisionType: "Тип приёма",
    living: "Проживание в год",
    website: "Сайт",
    visit: "Открыть сайт",
  },
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const universities = await getUniversities();
  const university = getUniversityBySlug(universities, slug);
  return { title: university?.name ?? copy[await getLocale()].fallbackTitle };
}

export default async function UniversityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [academic, records, universities, locale] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
    getLocale(),
  ]);
  const t = copy[locale];
  const money = (usd: number) => `$${formatNumber(locale, usd)}`;
  const university = getUniversityBySlug(universities, slug);

  if (!university) {
    notFound();
  }

  const hasProfile = hasAnyAcademicProfile(academic);
  const profile = hasProfile ? toStudentProfileInput(academic, resolveAchievements(records)) : null;

  // Previously the program's weights were applied only when this happened to
  // be the student's declared dream university — every other university on
  // the platform silently fell back to the defaults, and disagreed with what
  // the analysis page showed for the same school.
  const weights = await resolveWeightsForUniversity(academic, university.id);

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
            <UniversityLogo
              university={university}
              className="size-14 rounded-2xl text-base ring-2 ring-white/30"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {university.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/15 text-white">
                    {tagName(tag, locale)}
                  </Badge>
                ))}
              </div>
              <h1 className="mt-2 font-heading text-2xl font-semibold text-white sm:text-3xl">
                {university.name}
              </h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
                <MapPin className="size-3.5" />
                {university.city}, {countryName(university.country, locale)}
              </p>
            </div>
          </div>

          {match ? (
            <div className="flex flex-col items-start gap-2 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:items-end">
              <MatchBadge category={match.category} className="bg-white/90" />
              <p className="font-heading text-3xl font-semibold text-white">
                {match.score}%<span className="ml-1 text-sm font-normal text-white/70">{t.match}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:items-end">
              <p className="text-sm text-white/85">{t.completeToSee}</p>
              <Button render={<Link href="/dashboard/profile" />} size="sm" variant="secondary">
                <Sparkles />
                {t.completeProfile}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">{universityDescription(university, locale)}</p>
        <div className="flex flex-wrap items-center gap-2">
          <SetDreamUniversityButton academic={academic} universityId={university.id} />
          <UniversityActions universityName={university.shortName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label={t.worldRanking} value={`#${university.worldRanking}`} icon={Trophy} accent="brand" />
        {university.nationalRanking ? (
          <StatCard label={t.nationalRanking} value={`#${university.nationalRanking}`} icon={Gauge} accent="amber" />
        ) : null}
        <StatCard label={t.acceptance} value={`${university.acceptanceRate}%`} icon={Percent} accent="amber" />
        <StatCard label={t.selectivity} value={selectivityName(university.selectivityLevel, locale)} icon={Gauge} accent="rose" />
        <StatCard
          label={t.tuition}
          value={university.tuitionPerYearUsd === 0 ? t.fullyFunded : money(university.tuitionPerYearUsd)}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard label={t.deadline} value={deadlineText(university.applicationDeadline, locale)} icon={CalendarClock} accent="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <AcceptanceTrendChart data={university.acceptRateTrend} />

          <Card>
            <CardHeader>
              <CardTitle>{t.requirements}</CardTitle>
              <CardDescription>{t.requirementsNote}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {university.requirements.map((req) => {
                  const shown = requirementText(req, locale);
                  return (
                    <div key={req.label} className="rounded-lg border border-border p-3">
                      <dt className="text-xs text-muted-foreground">{shown.label}</dt>
                      <dd className="mt-1 text-sm font-medium">{shown.value}</dd>
                    </div>
                  );
                })}
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
                <CardTitle>{t.gap}</CardTitle>
                <CardDescription>{t.gapNote}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">{t.gapEmpty}</p>
                <Button render={<Link href="/dashboard/profile" />} size="sm">
                  {t.completeYourProfile}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-4 text-brand" />
                {t.scholarships}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-sm font-medium">{university.scholarshipAvailable ? t.available : t.notAvailable}</p>
              <p className="text-sm text-muted-foreground">{scholarshipText(university.scholarshipCoverage, locale)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-4 text-brand" />
                {t.decision}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.decisionType}</span>
                <span className="font-medium">{decisionName(university.decisionType, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.deadline}</span>
                <span className="font-medium">{deadlineText(university.applicationDeadline, locale)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.living}</span>
                <span className="font-medium">{money(university.livingCostPerYearUsd)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t.website}</span>
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-medium text-brand hover:underline"
                >
                  <Globe className="size-3.5" />
                  {t.visit}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
