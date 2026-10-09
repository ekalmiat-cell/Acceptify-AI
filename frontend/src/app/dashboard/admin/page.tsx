import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { AdminResetLink } from "@/components/admin/admin-reset-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBetaStats, type BetaStats } from "@/lib/data/beta-stats";
import { getUniversities } from "@/lib/universities-server";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Admin",
    intro: "Manage each university's programs and their per-criterion evaluation weights.",
    universities: "Universities",
    universitiesNote: "Pick a university to manage its programs and evaluation profiles.",
    funnel: "Beta funnel",
    funnelNote: (created: number, active: number) =>
      `${created} new and ${active} active students in the last 7 days. Page views are in Vercel → Analytics.`,
    steps: ["Signed up", "Filled in scores", "Ran an analysis", "Reviewed an essay"],
    ofSignups: (percent: string) => `${percent} of sign-ups`,
    perDay: "Sign-ups per day, last 14 days",
  },
  ru: {
    title: "Админка",
    intro: "Программы университетов и веса критериев в их моделях оценки.",
    universities: "Университеты",
    universitiesNote: "Выбери университет, чтобы управлять его программами и профилями оценки.",
    funnel: "Воронка беты",
    funnelNote: (created: number, active: number) =>
      `За последние 7 дней: ${created} новых и ${active} активных учеников. Просмотры страниц — в Vercel → Analytics.`,
    steps: ["Зарегистрировались", "Заполнили баллы", "Сделали анализ", "Отправили эссе на разбор"],
    ofSignups: (percent: string) => `${percent} от регистраций`,
    perDay: "Регистрации по дням, последние 14 дней",
  },
});

type Copy = (typeof copy)["en"];

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

export default async function AdminPage() {
  const [universities, stats, locale] = await Promise.all([getUniversities(), getBetaStats(), getLocale()]);
  const t = copy[locale];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
      </div>

      <BetaFunnelCard t={t} stats={stats} />

      <AdminResetLink />

      <Card>
        <CardHeader>
          <CardTitle>{t.universities}</CardTitle>
          <CardDescription>{t.universitiesNote}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {universities.map((university) => (
            <Link
              key={university.id}
              href={`/dashboard/admin/${university.id}`}
              className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
            >
              <UniversityLogo university={university} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{university.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {university.city}, {countryName(university.country, locale)}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BetaFunnelCard({ t, stats }: { t: Copy; stats: BetaStats }) {
  const steps = [
    { label: t.steps[0], value: stats.users },
    { label: t.steps[1], value: stats.withProfile },
    { label: t.steps[2], value: stats.withAnalysis },
    { label: t.steps[3], value: stats.withEssay },
  ];
  const percentOf = (value: number) =>
    stats.users > 0 ? `${Math.round((value / stats.users) * 100)}%` : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.funnel}</CardTitle>
        <CardDescription>{t.funnelNote(stats.newLast7Days, stats.activeLast7Days)}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.label} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{step.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{step.value}</p>
              <p className="text-xs text-muted-foreground">{t.ofSignups(percentOf(step.value))}</p>
            </div>
          ))}
        </div>
        {stats.signupsByDay.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t.perDay}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
              {stats.signupsByDay.map((d) => (
                <span key={d.day}>
                  {d.day.slice(5)} <span className="font-semibold">{d.count}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
