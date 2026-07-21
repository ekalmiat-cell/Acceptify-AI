import type { Metadata } from "next";

import { UniversitySearchView } from "@/components/dashboard/university-search-view";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { hasAnyAcademicProfile, resolveAchievements, toStudentProfileInput } from "@/lib/profile";

export const metadata: Metadata = {
  title: "Universities",
};

export default async function UniversitiesPage() {
  const [academic, records, universities] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);
  const profile = hasAnyAcademicProfile(academic)
    ? toStudentProfileInput(academic, resolveAchievements(records))
    : null;

  return <UniversitySearchView profile={profile} universities={universities} />;
}
