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

/** The accent is a small dot by the label, like a status light on a board. */
const accentDot: Record<NonNullable<StatCardProps["accent"]>, string> = {
  brand: "bg-brand",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "brand",
}: StatCardProps) {
  return (
    <Card className="hover-lift">
      <CardContent className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
            <span className={cn("size-1.5 shrink-0 rounded-full", accentDot[accent])} />
            {label}
          </p>
          <p className="mt-2.5 font-display text-[1.75rem] leading-none font-bold text-foreground">{value}</p>
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
        <Icon className="size-4.5 shrink-0 text-muted-foreground/70" />
      </CardContent>
    </Card>
  );
}
