import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/shared/match-badge";
import { getUniversities } from "@/lib/universities-server";
import { predictMatch } from "@/lib/predict";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { hasAnyAcademicProfile, resolveAchievements, toStudentProfileInput } from "@/lib/profile";
import { resolveWeightsByUniversity } from "@/lib/weights-server";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Recommended for you",
    subtitle: "Based on your current profile",
    none: "No recommendations yet",
    noneNote: "Add at least one academic score (GPA, SAT, IELTS, TOEFL, ACT, or ENT) to your profile to get matched.",
    complete: "Complete your profile",
    explore: "Explore all universities",
  },
  ru: {
    title: "Рекомендуем тебе",
    subtitle: "На основе твоего текущего профиля",
    none: "Рекомендаций пока нет",
    noneNote: "Добавь в профиль хотя бы один балл (GPA, SAT, IELTS, TOEFL, ACT или ЕНТ), чтобы мы подобрали университеты.",
    complete: "Заполнить профиль",
    explore: "Все университеты",
  },
});

export async function RecommendationsList() {
  const locale = await getLocale();
  const t = copy[locale];
  const [academic, records, universities] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);

  if (!hasAnyAcademicProfile(academic)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{t.none}</p>
            <p className="text-sm text-muted-foreground">{t.noneNote}</p>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" className="mt-1">
            {t.complete}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profile = toStudentProfileInput(academic, resolveAchievements(records));

  // Same weights the search page and each university's own page use, so a
  // school recommended here shows the same number when it's opened.
  const weightsByUniversity = await resolveWeightsByUniversity(
    academic,
    universities.map((university) => university.id)
  );

  const recommendations = universities
    .map((university) => ({
      university,
      ...predictMatch(university, profile, weightsByUniversity[university.id]),
    }))
    .filter((r) => r.category !== "reach")
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {recommendations.map(({ university, score, category }) => (
          <Link
            key={university.id}
            href={`/dashboard/universities/${university.slug}`}
            className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
          >
            <UniversityLogo university={university} className="size-9" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {university.shortName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {university.city}, {countryName(university.country, locale)}
              </p>
            </div>
            <MatchBadge category={category} showLabel={false} />
            <span className="w-9 shrink-0 text-right font-mono text-xs text-muted-foreground">
              {score}%
            </span>
          </Link>
        ))}

        <Button
          render={<Link href="/dashboard/universities" />}
          variant="ghost"
          className="mt-2 justify-center"
        >
          {t.explore}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
