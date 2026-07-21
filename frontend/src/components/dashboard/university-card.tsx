import Link from "next/link";
import { MapPin, GraduationCap } from "lucide-react";

import { MatchBadge } from "@/components/shared/match-badge";
import type { MatchCategory, University } from "@/types/domain";

export function UniversityCard({
  university,
  score,
  category,
}: {
  university: University;
  score: number;
  category: MatchCategory;
}) {
  return (
    <Link
      href={`/dashboard/universities/${university.slug}`}
      className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
          }}
        >
          {university.logoInitials}
        </span>
        <MatchBadge category={category} />
      </div>

      <div>
        <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground">
          {university.name}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {university.city}, {university.country}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {university.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <GraduationCap className="size-3.5" />
          Rank #{university.worldRanking}
        </div>
        <div className="text-right">
          <p className="text-[0.65rem] text-muted-foreground">Your match</p>
          <p className="font-mono text-lg font-semibold leading-none text-foreground">
            {score}%
          </p>
        </div>
      </div>
    </Link>
  );
}
