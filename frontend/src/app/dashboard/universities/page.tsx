import type { Metadata } from "next";

import { UniversitySearchView } from "@/components/dashboard/university-search-view";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { hasAnyAcademicProfile, resolveAchievements, toStudentProfileInput } from "@/lib/profile";
import { getDeclaredField, resolveWeightsByUniversity } from "@/lib/weights-server";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({ en: { title: "Universities" }, ru: { title: "Университеты" } });

export async function generateMetadata(): Promise<Metadata> {
  return { title: copy[await getLocale()].title };
}

export default async function UniversitiesPage() {
  const [academic, records, universities] = await Promise.all([
    getAcademicProfile(),
    getAchievementRecords(),
    getUniversities(),
  ]);
  const profile = hasAnyAcademicProfile(academic)
    ? toStudentProfileInput(academic, resolveAchievements(records))
    : null;

  // Search used to score every university with the platform defaults, which
  // is why the same university read differently here and on its own page.
  // Both now go through the one resolver — see lib/weights-server.ts.
  const [weightsByUniversity, declaredField] = await Promise.all([
    resolveWeightsByUniversity(academic, universities.map((university) => university.id)),
    getDeclaredField(academic),
  ]);

  return (
    <UniversitySearchView
      profile={profile}
      universities={universities}
      weightsByUniversity={weightsByUniversity}
      declaredField={declaredField}
    />
  );
}
