import Link from "next/link";
import { MapPin, GraduationCap, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/shared/match-badge";
import type { MatchCategory, University } from "@/types/domain";

export function UniversityCard({
  university,
  score,
  category,
}: {
  university: University;
  score: number | null;
  category: MatchCategory | null;
}) {
  return (
    <div className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/universities/${university.slug}`}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
            }}
          >
            {university.logoInitials}
          </Link>
          {category ? (
            <MatchBadge category={category} />
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
              <span className="size-1.5 rounded-full bg-muted-foreground/50" />
              General
            </span>
          )}
        </div>

        <div>
          <h3 className="line-clamp-1 font-heading text-sm font-semibold text-foreground">
            <Link
              href={`/dashboard/universities/${university.slug}`}
              className="transition-colors hover:text-primary"
            >
              {university.name}
            </Link>
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
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <GraduationCap className="size-3.5" />
            Rank #{university.worldRanking}
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] text-muted-foreground">Your match</p>
            <p className="font-mono text-base font-semibold leading-none text-foreground">
              {score !== null && score !== undefined ? `${score}%` : "—"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            size="xs"
            variant="outline"
            render={<Link href={`/dashboard/universities/${university.slug}`} />}
            className="h-7 w-full text-xs"
          >
            Details
          </Button>
          <Button
            size="xs"
            variant="default"
            render={<Link href={`/dashboard/analysis?universityId=${university.id}`} />}
            className="h-7 w-full gap-1 bg-gradient-brand text-xs text-white hover:opacity-90"
          >
            <Sparkles className="size-3" />
            Analyze
          </Button>
        </div>
      </div>
    </div>
  );
}
