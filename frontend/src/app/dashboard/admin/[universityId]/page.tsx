import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminProgramList } from "@/components/admin/admin-program-list";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";
import { getProgramsByUniversity } from "@/lib/programs-server";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ universityId: string }>;
}): Promise<Metadata> {
  const { universityId } = await params;
  const universities = await getUniversities();
  const university = getUniversityById(universities, universityId);
  const admin = (await getLocale()) === "ru" ? "Админка" : "Admin";
  return { title: university ? `${admin} — ${university.shortName}` : admin };
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
