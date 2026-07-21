import { cn } from "@/lib/utils";
import { matchCategoryMeta } from "@/lib/predict";
import type { MatchCategory } from "@/types/domain";

const styles: Record<MatchCategory, string> = {
  safe: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  target: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  reach: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
};

const dots: Record<MatchCategory, string> = {
  safe: "bg-emerald-500",
  target: "bg-amber-500",
  reach: "bg-rose-500",
};

export function MatchBadge({
  category,
  className,
  showLabel = true,
}: {
  category: MatchCategory;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        styles[category],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", dots[category])} />
      {showLabel ? matchCategoryMeta[category].label : null}
    </span>
  );
}
