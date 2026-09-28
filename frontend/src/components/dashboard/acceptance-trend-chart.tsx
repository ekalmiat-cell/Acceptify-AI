"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: { rate: "Acceptance rate", title: "Acceptance rate trend", subtitle: "Reported admit rate by application year" },
  ru: { rate: "Доля принятых", title: "Динамика приёма", subtitle: "Заявленная доля принятых по годам подачи" },
});

export function AcceptanceTrendChart({
  data,
}: {
  data: { year: string; rate: number }[];
}) {
  const t = useCopy(copy);
  const chartConfig = { rate: { label: t.rate, color: "var(--color-chart-1)" } } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
          <BarChart data={data} margin={{ left: -16, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={36} unit="%" />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="rate" fill="var(--color-rate)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
