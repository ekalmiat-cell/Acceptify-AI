import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { AnalysisView } from "@/components/dashboard/analysis-view";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import {
  computeProfileCompleteness,
  hasAnyAcademicProfile,
  resolveAchievements,
  toStudentProfileInput,
} from "@/lib/profile";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  title: "Analysis",
};

export default async function AnalysisPage() {
  const [session, academic, records, universities] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);

  const achievements = resolveAchievements(records);
  const hasProfile = hasAnyAcademicProfile(academic);
  const profile = hasProfile ? toStudentProfileInput(academic, achievements) : null;
  const completeness = computeProfileCompleteness(academic, achievements);

  return (
    <AnalysisView
      studentName={session?.user?.name ?? "Your name"}
      studentEmail={session?.user?.email ?? ""}
      universities={universities}
      profile={profile}
      profileCompleteness={completeness}
      dreamUniversityId={academic.dreamUniversityId}
      dreamProgramId={academic.dreamProgramId}
    />
  );
}
