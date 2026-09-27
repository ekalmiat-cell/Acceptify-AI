import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EssayStudio } from "@/components/dashboard/essays/studio/essay-studio";
import { aiAllowanceLeft } from "@/lib/data/ai-usage";
import { listEssayReviewsServer } from "@/lib/essays-server";
import { getAcademicProfile } from "@/lib/profile-server";
import { getCurrentUserId } from "@/lib/session";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  title: "Essay Studio",
  description: "Write or paste your admissions essay, fix the quick things live, and get a rubric-based AI review.",
};

export default async function EssaysPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in?redirect=/dashboard/essays");

  const [universities, history, academic, reviewsLeft] = await Promise.all([
    getUniversities(),
    listEssayReviewsServer(),
    getAcademicProfile(),
    aiAllowanceLeft(userId, "essay_review"),
  ]);

  return (
    <EssayStudio
      universities={universities}
      initialHistory={history}
      initialUniversityId={academic.dreamUniversityId}
      initialReviewsLeft={reviewsLeft}
    />
  );
}
