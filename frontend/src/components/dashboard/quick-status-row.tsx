import Link from "next/link";
import { GraduationCap, ListChecks, UserRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { countryName } from "@/lib/countries";
import { defineCopy, plural } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    completion: "Profile completion",
    dream: "Dream university",
    notSelected: "Not selected yet",
    pickOne: "Pick one from your profile",
    analysis: "Admission analysis",
    reports: (n: number) => `${n} report${n === 1 ? "" : "s"}`,
    notStarted: "Not started",
    viewLatest: "View your latest analysis",
    runFirst: "Run your first admission analysis",
  },
  ru: {
    completion: "Заполненность профиля",
    dream: "Университет мечты",
    notSelected: "Пока не выбран",
    pickOne: "Выбери его в профиле",
    analysis: "Анализ поступления",
    reports: (n: number) => `${n} ${plural("ru", n, { one: "отчёт", few: "отчёта", many: "отчётов" })}`,
    notStarted: "Ещё не начат",
    viewLatest: "Посмотреть последний анализ",
    runFirst: "Запусти первый анализ поступления",
  },
});

export async function QuickStatusRow({
  profileCompleteness,
  dreamUniversity,
  reportsCount,
}: {
  profileCompleteness: number;
  dreamUniversity: University | null;
  reportsCount: number;
}) {
  const locale = await getLocale();
  const t = copy[locale];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Link href="/dashboard/profile">
        <Card className="hover-lift h-full">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
              <UserRound className="size-3.5" />
              {t.completion}
            </div>
            <p className="font-display text-2xl leading-none font-bold text-foreground sm:text-[1.75rem]">
              {profileCompleteness}%
            </p>
            <Progress value={profileCompleteness}>
              <ProgressTrack>
                <ProgressIndicator className="bg-gradient-brand" />
              </ProgressTrack>
            </Progress>
          </CardContent>
        </Card>
      </Link>

      <Link href={dreamUniversity ? `/dashboard/universities/${dreamUniversity.slug}` : "/dashboard/profile"}>
        <Card className="hover-lift h-full">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
              <GraduationCap className="size-3.5" />
              {t.dream}
            </div>
            <p className="truncate font-display text-base font-bold text-foreground sm:text-lg">
              {dreamUniversity?.name ?? t.notSelected}
            </p>
            <p className="text-xs text-muted-foreground">
              {dreamUniversity
                ? `${dreamUniversity.city}, ${countryName(dreamUniversity.country, locale)}`
                : t.pickOne}
            </p>
          </CardContent>
        </Card>
      </Link>

      {/* Full width on a phone: "Not started" in the display face needs the room. */}
      <Link href="/dashboard/analysis" className="col-span-2 sm:col-span-1">
        <Card className="hover-lift h-full">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
              <ListChecks className="size-3.5" />
              {t.analysis}
            </div>
            <p className="font-display text-2xl leading-none font-bold text-foreground sm:text-[1.75rem]">
              {reportsCount > 0 ? t.reports(reportsCount) : t.notStarted}
            </p>
            <p className="text-xs text-muted-foreground">
              {reportsCount > 0 ? t.viewLatest : t.runFirst}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
