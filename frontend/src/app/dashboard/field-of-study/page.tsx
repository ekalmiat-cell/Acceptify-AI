import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FieldOfStudySelect } from "@/components/profile/field-of-study-select";
import { getAcademicProfile } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";

export const metadata: Metadata = {
  title: "Field of Study",
};

export default async function FieldOfStudyPage({
  searchParams,
}: {
  searchParams: Promise<{ universityId?: string }>;
}) {
  const { universityId } = await searchParams;
  const [academic, universities] = await Promise.all([getAcademicProfile(), getUniversities()]);

  const targetId = universityId ?? academic.dreamUniversityId ?? undefined;
  const university = targetId ? getUniversityById(universities, targetId) : undefined;

  if (!university) {
    notFound();
  }

  return <FieldOfStudySelect university={university} profile={academic} />;
}
