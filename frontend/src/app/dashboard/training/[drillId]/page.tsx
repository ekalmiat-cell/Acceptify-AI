import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DrillView } from "@/components/dashboard/training/drill-view";
import { aiAllowanceLeft } from "@/lib/data/ai-usage";
import {
  drillsFromReview,
  getLatestReview,
  getTrainingProgress,
  resolveDrill,
} from "@/lib/data/training";
import { getCurrentUserId } from "@/lib/session";
import { DRILLS, drillsInUnit, findUnit, nextDrill } from "@/lib/training/drills";

export const metadata: Metadata = {
  title: "Training drill",
};

export default async function DrillPage({ params }: { params: Promise<{ drillId: string }> }) {
  const { drillId } = await params;
  const userId = await getCurrentUserId();
  if (!userId) redirect(`/sign-in?redirect=/dashboard/training/${encodeURIComponent(drillId)}`);

  const drill = await resolveDrill(userId, drillId);
  if (!drill) notFound();

  const [progress, coachLeft] = await Promise.all([
    getTrainingProgress(userId),
    aiAllowanceLeft(userId, "training_feedback"),
  ]);
  const completed = new Set([...progress.completed, drill.id]);

  const unit = findUnit(drill.unit);
  const personal = "reviewId" in drill;
  const inUnit = drillsInUnit(unit.key);

  // After one of the essay's own sentences comes the next one; after the
  // last of them, the course.
  let next: string | null;
  if (personal) {
    const own = drillsFromReview(await getLatestReview(userId));
    next =
      own.find((d) => !completed.has(d.id))?.id ??
      DRILLS.find((d) => !completed.has(d.id))?.id ??
      null;
  } else {
    next = nextDrill(drill.id, completed)?.id ?? null;
  }

  return (
    <DrillView
      key={drill.id}
      drill={drill}
      unit={unit}
      position={personal ? null : { index: inUnit.findIndex((d) => d.id === drill.id) + 1, total: inUnit.length }}
      essayTitle={personal ? drill.essayTitle : null}
      nextHref={next ? `/dashboard/training/${next}` : null}
      initialCoachLeft={coachLeft}
    />
  );
}
