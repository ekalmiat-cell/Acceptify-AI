import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminProgramList } from "@/components/admin/admin-program-list";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";
import { getProgramsByUniversity } from "@/lib/programs-server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ universityId: string }>;
}): Promise<Metadata> {
  const { universityId } = await params;
  const universities = await getUniversities();
  const university = getUniversityById(universities, universityId);
  return { title: university ? `Admin — ${university.shortName}` : "Admin" };
}

export default async function AdminUniversityPage({
  params,
}: {
  params: Promise<{ universityId: string }>;
}) {
  const { universityId } = await params;
  const [universities, programs] = await Promise.all([
    getUniversities(),
    getProgramsByUniversity(universityId),
  ]);
  const university = getUniversityById(universities, universityId);

  if (!university) {
    notFound();
  }

  return <AdminProgramList university={university} programs={programs} />;
}
