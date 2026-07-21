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
import type { PredictionHistoryEntry } from "@/types/domain";

const chartConfig = {
  score: {
    label: "Match score",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

export function MatchTrendChart({
  predictions,
}: {
  predictions: PredictionHistoryEntry[];
}) {
  const data = [...predictions]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((p) => ({
      date: new Date(p.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: p.matchScore,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match score trend</CardTitle>
          <CardDescription>Your predicted chances over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">
            No predictions yet — run one to start tracking your match score over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match score trend</CardTitle>
        <CardDescription>Your predicted chances over your last {data.length} predictions</CardDescription>
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
