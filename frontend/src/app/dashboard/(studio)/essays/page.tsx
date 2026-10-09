import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EssayStudio } from "@/components/dashboard/essays/studio/essay-studio";
import { aiAllowanceLeft } from "@/lib/data/ai-usage";
import { listEssayReviewsServer } from "@/lib/essays-server";
import { getAcademicProfile } from "@/lib/profile-server";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import { getCurrentUserId } from "@/lib/session";
import { getUniversities } from "@/lib/universities-server";

const copy = defineCopy({
  en: {
    title: "Essay Studio",
    description: "Write or paste your admissions essay, fix the quick things live, and get a rubric-based AI review.",
  },
  ru: {
    title: "Эссе-студия",
    description: "Напиши или вставь эссе для поступления, исправь мелочи на лету и получи разбор ИИ по рубрике.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = copy[await getLocale()];
  return { title: t.title, description: t.description };
}

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
