import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminWeightEditor } from "@/components/admin/admin-weight-editor";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";
import { getProgramsByUniversity, getEvaluationProfile } from "@/lib/programs-server";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getLocale()) === "ru" ? "Веса оценки" : "Edit evaluation profile" };
}

export default async function AdminProgramPage({
  params,
}: {
  params: Promise<{ universityId: string; programId: string }>;
}) {
  const { universityId, programId } = await params;
  const [universities, programs] = await Promise.all([
    getUniversities(),
    getProgramsByUniversity(universityId),
  ]);
  const university = getUniversityById(universities, universityId);
  const program = programs.find((p) => p.id === programId);

  if (!university || !program) {
    notFound();
  }

  const evaluationProfile = await getEvaluationProfile(program.id);

  return (
    <AdminWeightEditor university={university} program={program} evaluationProfile={evaluationProfile} />
  );
}
