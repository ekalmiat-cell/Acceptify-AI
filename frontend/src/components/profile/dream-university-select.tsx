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

export function DreamUniversitySelect({
  profile,
  universities,
}: {
  profile: AcademicProfile;
  universities: University[];
}) {
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
      await updateAcademicProfile({ ...profile, dreamUniversityId: selected || null });
      toast.success("Dream university updated");
      router.refresh();
    } catch {
      toast.error("Could not update your dream university.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-4 text-brand" />
          Dream university
        </CardTitle>
        <CardDescription>
          Pinned to the top of your dashboard and used as the default target for analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={country} onValueChange={(v) => handleCountryChange(v as string)}>
          <SelectTrigger className="w-full sm:max-w-52">
            <SelectValue placeholder="1. Choose a country" />
          </SelectTrigger>
          <SelectContent>
            {byCountry.map((g) => (
              <SelectItem key={g.country} value={g.country}>
                {g.country}
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
            <SelectValue placeholder="2. Choose a university">
              {(value: string) => universities.find((u) => u.id === value)?.name ?? "2. Choose a university"}
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
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
