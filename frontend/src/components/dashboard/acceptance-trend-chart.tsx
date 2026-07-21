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

const chartConfig = {
  rate: {
    label: "Acceptance rate",
    color: "var(--color-chart-1)",
  },
} satisfies ChartConfig;

export function AcceptanceTrendChart({
  data,
}: {
  data: { year: string; rate: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Acceptance rate trend</CardTitle>
        <CardDescription>Reported admit rate by application year</CardDescription>
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
