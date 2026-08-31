import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PortfolioView } from "@/components/dashboard/portfolio-view";
import { buildPortfolio, suggestShortlist } from "@/lib/portfolio";
import { getPredictionHistory } from "@/lib/predictions-server";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import {
  computeProfileCompleteness,
  hasAnyAcademicProfile,
  resolveAchievements,
  toStudentProfileInput,
} from "@/lib/profile";
import { getUniversities } from "@/lib/universities-server";
import { resolveWeightsByUniversity } from "@/lib/weights-server";

export const metadata: Metadata = {
  title: "Portfolio",
};

/** Below this, a saved list is too thin to be a strategy, so the page offers
 * a balanced starting one instead — and says that it is doing so. */
const MIN_SAVED_FOR_OWN_LIST = 3;

export default async function PortfolioPage() {
  const [academic, records, universities, history] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
    getPredictionHistory(),
  ]);

  const achievements = resolveAchievements(records);
  const completeness = computeProfileCompleteness(academic, achievements);

  if (!hasAnyAcademicProfile(academic)) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Application portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            What your applications add up to, taken together.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Complete your profile first</p>
            <p className="text-xs text-muted-foreground">
              Add at least one academic score and we can build your portfolio.
            </p>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" className="mt-1">
            Complete your profile
          </Button>
        </div>
      </div>
    );
  }

  const profile = toStudentProfileInput(academic, achievements);

  // Resolved once for the whole catalog: `suggestShortlist` has to score
  // every university to pick a balanced set, and the per-programme lookups
  // behind this are cached per programme rather than per university.
  const weightsByUniversity = await resolveWeightsByUniversity(
    academic,
    universities.map((university) => university.id)
  );

  // The student's own shortlist is whatever they have saved reports for —
  // deduplicated, since running the same university twice is one application.
  const savedIds = Array.from(new Set(history.map((entry) => entry.universityId)));
  const saved = universities.filter((university) => savedIds.includes(university.id));

  const isSuggested = saved.length < MIN_SAVED_FOR_OWN_LIST;
  const shortlist = isSuggested
    ? suggestShortlist(universities, profile, weightsByUniversity, completeness)
    : saved;

  const portfolio = buildPortfolio(shortlist, profile, weightsByUniversity, completeness);

  return <PortfolioView portfolio={portfolio} isSuggested={isSuggested} />;
}
