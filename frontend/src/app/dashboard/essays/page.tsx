import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { EssayReviewerView } from "@/components/dashboard/essays/essay-reviewer-view";
import { getUniversities } from "@/lib/universities-server";
import { listEssayReviewsServer } from "@/lib/essays-server";
import { getAcademicProfile } from "@/lib/profile-server";

export const metadata: Metadata = {
  title: "AI Essay Reviewer | Acceptify AI",
  description: "Admissions essay critique, narrative feedback, cliché detection, and prompt alignment.",
};

export default async function EssaysPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const [universities, history, academic] = await Promise.all([
    getUniversities(),
    listEssayReviewsServer(),
    getAcademicProfile(),
  ]);

  return (
    <EssayReviewerView
      universities={universities}
      initialHistory={history}
      initialUniversityId={academic.dreamUniversityId}
    />
  );
}
