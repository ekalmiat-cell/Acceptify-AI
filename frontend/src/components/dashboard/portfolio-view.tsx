import Link from "next/link";
import { Info, ShieldCheck, Target, Flame, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StickerBoard } from "@/components/dashboard/sticker-board";
import { formatProbability } from "@/lib/probability";
import type { Portfolio } from "@/lib/portfolio";
import { defineCopy, plural } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Application portfolio",
    suggested: "A balanced starting list, built from your profile. Save reports from the analysis page to make this your own.",
    own: "Every university you've saved a report for, and what they add up to.",
    atLeastOne: "Chance of at least one admission",
    across: (n: number) => `Across all ${n} application${n === 1 ? "" : "s"} on this list`,
    rangeNote:
      "The high end assumes each decision is independent; the low end assumes they move together, in which case your best single chance is the whole story. Reality sits between the two — committees read overlapping signals, so a weak application is weak in several places at once.",
    balance: "Balance",
    balanceNote: "How the list is spread",
    safe: "Safe",
    target: "Target",
    reach: "Reach",
    worthFixing: "Worth fixing about this list",
    applications: "Your board",
    applicationsNote:
      "Each sticker is one application. Fit is how closely you match what the programme asks for; the chance combines that fit with the university's acceptance rate.",
    disclaimer:
      "These probabilities are model estimates, not measured rates — the model has not yet been fitted against real admission outcomes.",
    how: "How this is calculated",
    add: "Add another university",
  },
  ru: {
    title: "Портфель заявок",
    suggested: "Сбалансированный стартовый список по твоему профилю. Сохраняй отчёты на странице анализа, чтобы собрать свой.",
    own: "Все университеты с сохранёнными отчётами и то, что они дают вместе.",
    atLeastOne: "Шанс поступить хотя бы в один",
    across: (n: number) => `По всем ${n} ${plural("ru", n, { one: "заявке", few: "заявкам", many: "заявкам" })} в этом списке`,
    rangeNote:
      "Верхняя граница считает решения независимыми; нижняя — что они принимаются «вместе», и тогда всё решает твой лучший отдельный шанс. Реальность где-то между: комиссии видят похожие сигналы, поэтому слабая заявка слаба сразу в нескольких местах.",
    balance: "Баланс",
    balanceNote: "Как распределён список",
    safe: "Надёжные",
    target: "Целевые",
    reach: "Амбициозные",
    worthFixing: "Что стоит поправить в списке",
    applications: "Твоя доска",
    applicationsNote:
      "Каждый стикер — одна заявка. Соответствие показывает, насколько ты подходишь под требования программы; шанс объединяет его с долей принятых в университет.",
    disclaimer:
      "Эти вероятности — оценки модели, а не измеренные доли: модель ещё не сверена с реальными результатами поступления.",
    how: "Как это считается",
    add: "Добавить университет",
  },
});

export async function PortfolioView({
  portfolio,
  isSuggested,
  dreamUniversityId,
}: {
  portfolio: Portfolio;
  dreamUniversityId: string | null;
  /** True when the student hasn't saved enough reports yet and the list
   * below is a suggestion rather than their own shortlist. Said plainly:
   * presenting a suggestion as "your applications" would be a fiction the
   * rest of the page then does arithmetic on. */
  isSuggested: boolean;
}) {
  const t = copy[await getLocale()];
  const { entries, balance, odds, warnings } = portfolio;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">{isSuggested ? t.suggested : t.own}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.atLeastOne}</CardTitle>
            <CardDescription>{t.across(entries.length)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-4xl font-semibold text-foreground">
                {formatProbability(odds.correlated)} – {formatProbability(odds.independent)}
              </span>
            </div>
            {/*
              A range, not a number, because the two ends are the two honest
              readings of the same list. Admissions decisions are correlated —
              the same essay and the same transcript are read everywhere — so
              the independent figure is an upper bound, and the best single
              chance is what remains if the correlation is total.
            */}
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{t.rangeNote}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.balance}</CardTitle>
            <CardDescription>{t.balanceNote}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BalanceRow icon={ShieldCheck} label={t.safe} count={balance.safe} accent="emerald" />
            <BalanceRow icon={Target} label={t.target} count={balance.target} accent="amber" />
            <BalanceRow icon={Flame} label={t.reach} count={balance.reach} accent="rose" />
          </CardContent>
        </Card>
      </div>

      {warnings.length > 0 ? (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TriangleAlert className="size-4" />
              </span>
              {t.worthFixing}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t.applications}</CardTitle>
          <CardDescription>{t.applicationsNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <StickerBoard entries={entries} dreamUniversityId={dreamUniversityId} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t.disclaimer}{" "}
          <Link href="/dashboard/methodology" className="underline hover:text-foreground">
            {t.how}
          </Link>
          .
        </p>
        <Button render={<Link href="/dashboard/analysis" />} size="sm" variant="outline">
          {t.add}
        </Button>
      </div>
    </div>
  );
}

const balanceAccent = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
} as const;

function BalanceRow({
  icon: Icon,
  label,
  count,
  accent,
}: {
  icon: typeof ShieldCheck;
  label: string;
  count: number;
  accent: keyof typeof balanceAccent;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-7 items-center justify-center rounded-lg ${balanceAccent[accent]}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="outline" className="ml-auto font-mono">
        {count}
      </Badge>
    </div>
  );
}
