"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { defineCopy, formatDate, plural } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import type { PredictionHistoryEntry } from "@/types/domain";

const copy = defineCopy({
  en: {
    score: "Match score",
    title: "Match score trend",
    empty: "Your fit scores over time",
    emptyNote: "No predictions yet — run one to start tracking your match score over time.",
    last: (n: number) => `Your fit scores over your last ${n} predictions`,
  },
  ru: {
    score: "Соответствие",
    title: "Динамика соответствия",
    empty: "Твои баллы соответствия во времени",
    emptyNote: "Прогнозов пока нет — сделай первый, чтобы следить за динамикой.",
    last: (n: number) =>
      `Баллы соответствия за последние ${n} ${plural("ru", n, { one: "прогноз", few: "прогноза", many: "прогнозов" })}`,
  },
});

export function MatchTrendChart({
  predictions,
}: {
  predictions: PredictionHistoryEntry[];
}) {
  const locale = useLocale();
  const t = copy[locale];
  const chartConfig = {
    score: { label: t.score, color: "var(--color-chart-1)" },
  } satisfies ChartConfig;
  const data = [...predictions]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((p) => ({
      date: formatDate(locale, p.createdAt, { month: "short", day: "numeric" }),
      score: p.matchScore,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.empty}</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">{t.emptyNote}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.last(data.length)}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <AreaChart data={data} margin={{ left: -16, right: 12, top: 8 }}>
            <defs>
              <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 100]}
              width={32}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="score"
              type="monotone"
              fill="url(#fillScore)"
              stroke="var(--color-score)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
