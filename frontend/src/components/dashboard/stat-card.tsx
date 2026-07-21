import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "brand" | "emerald" | "amber" | "rose";
}

const accentStyles: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand/10 text-brand",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "brand",
}: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
            {value}
          </p>
          {trend ? (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {trend.positive ? "+" : ""}
              {trend.value}
            </p>
          ) : null}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", accentStyles[accent])}>
          <Icon className="size-4.5" />
        </span>
      </CardContent>
    </Card>
  );
}
