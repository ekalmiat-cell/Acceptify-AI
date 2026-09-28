"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAcademicProfile } from "@/lib/profile-client";
import { groupUniversitiesByCountry } from "@/lib/universities";
import type { AcademicProfile, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    updated: "Dream university updated",
    failed: "Could not update your dream university.",
    title: "Dream university",
    subtitle: "Pinned to the top of your dashboard and used as the default target for analysis.",
    country: "1. Choose a country",
    university: "2. Choose a university",
    save: "Save",
  },
  ru: {
    updated: "Университет мечты обновлён",
    failed: "Не удалось обновить университет мечты.",
    title: "Университет мечты",
    subtitle: "Закрепляется вверху обзора и выбирается по умолчанию в анализе.",
    country: "1. Выбери страну",
    university: "2. Выбери университет",
    save: "Сохранить",
  },
});

export function DreamUniversitySelect({
  profile,
  universities,
}: {
  profile: AcademicProfile;
  universities: University[];
}) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const byCountry = useMemo(() => groupUniversitiesByCountry(universities), [universities]);

  const currentUniversity = universities.find((u) => u.id === profile.dreamUniversityId);
  const [country, setCountry] = useState(currentUniversity?.country ?? "");
  const [selected, setSelected] = useState(profile.dreamUniversityId ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const universitiesInCountry = byCountry.find((g) => g.country === country)?.universities ?? [];
  const dirty = selected !== (profile.dreamUniversityId ?? "");

  function handleCountryChange(next: string) {
    setCountry(next);
    setSelected("");
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAcademicProfile({
        ...profile,
        dreamUniversityId: selected || null,
        dreamProgramId: selected ? profile.dreamProgramId : null,
      });
      toast.success(t.updated);
      if (selected) {
        router.push(`/dashboard/field-of-study?universityId=${selected}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-4 text-brand" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={country} onValueChange={(v) => handleCountryChange(v as string)}>
          <SelectTrigger className="w-full sm:max-w-52">
            <SelectValue placeholder={t.country}>
              {(value: string) => (value ? countryName(value, locale) : t.country)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {byCountry.map((g) => (
              <SelectItem key={g.country} value={g.country}>
                {countryName(g.country, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selected}
          onValueChange={(v) => setSelected(v as string)}
          disabled={!country}
        >
          <SelectTrigger className="w-full sm:max-w-sm">
            <SelectValue placeholder={t.university}>
              {(value: string) => universities.find((u) => u.id === value)?.name ?? t.university}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {universitiesInCountry.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={!dirty || isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : null}
          {t.save}
        </Button>
      </CardContent>
    </Card>
  );
}
