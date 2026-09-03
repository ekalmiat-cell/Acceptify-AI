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
import { getDeclaredField } from "@/lib/weights-server";

export const metadata: Metadata = {
  title: "Analysis",
};

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams?: Promise<{ universityId?: string; university?: string }>;
}) {
  const [resolvedParams, session, academic, records, universities] = await Promise.all([
    searchParams ? searchParams : Promise.resolve(undefined),
    auth.api.getSession({ headers: await headers() }),
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);

  const safeAcademic = academic ?? {
    gpa: null,
    satScore: null,
    actScore: null,
    ieltsScore: null,
    toeflScore: null,
    entScore: null,
    dreamUniversityId: null,
    dreamProgramId: null,
  };
  const safeUniversities = Array.isArray(universities) ? universities : [];
  const initialUniversityId = resolvedParams?.universityId || resolvedParams?.university || null;

  const declaredField = await getDeclaredField(safeAcademic);
  const achievements = resolveAchievements(records);
  const hasProfile = hasAnyAcademicProfile(safeAcademic);
  const profile = hasProfile ? toStudentProfileInput(safeAcademic, achievements) : null;
  const completeness = computeProfileCompleteness(safeAcademic, achievements);

  return (
    <AnalysisView
      studentName={session?.user?.name ?? "Your name"}
      studentEmail={session?.user?.email ?? ""}
      universities={safeUniversities}
      profile={profile}
      profileCompleteness={completeness}
      dreamUniversityId={safeAcademic.dreamUniversityId}
      dreamProgramId={safeAcademic.dreamProgramId}
      declaredField={declaredField}
      initialUniversityId={initialUniversityId}
    />
  );
}
