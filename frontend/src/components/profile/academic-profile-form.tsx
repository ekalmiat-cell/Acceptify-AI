"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAcademicProfile } from "@/lib/profile-client";
import type { AcademicProfile } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    updated: "Academic profile updated",
    failed: "Could not update your academic profile.",
    title: "Academic scores",
    subtitle: "GPA, SAT, and IELTS directly drive your predicted match score for every university.",
    eg: (value: string) => `e.g. ${value}`,
    ent: "National exam (ENT)",
    save: "Save scores",
  },
  ru: {
    updated: "Академический профиль обновлён",
    failed: "Не удалось обновить академический профиль.",
    title: "Академические баллы",
    subtitle: "GPA, SAT и IELTS напрямую влияют на прогноз соответствия для каждого университета.",
    eg: (value: string) => `например, ${value}`,
    ent: "ЕНТ",
    save: "Сохранить баллы",
  },
});

function toInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function AcademicProfileForm({ profile }: { profile: AcademicProfile }) {
  const t = useCopy(copy);
  const router = useRouter();
  const [gpa, setGpa] = useState(toInputValue(profile.gpa));
  const [satScore, setSatScore] = useState(toInputValue(profile.satScore));
  const [actScore, setActScore] = useState(toInputValue(profile.actScore));
  const [ieltsScore, setIeltsScore] = useState(toInputValue(profile.ieltsScore));
  const [toeflScore, setToeflScore] = useState(toInputValue(profile.toeflScore));
  const [entScore, setEntScore] = useState(toInputValue(profile.entScore));
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateAcademicProfile({
        gpa: toNumberOrNull(gpa),
        satScore: toNumberOrNull(satScore),
        actScore: toNumberOrNull(actScore),
        ieltsScore: toNumberOrNull(ieltsScore),
        toeflScore: toNumberOrNull(toeflScore),
        entScore: toNumberOrNull(entScore),
        dreamUniversityId: profile.dreamUniversityId,
        dreamProgramId: profile.dreamProgramId,
      });
      toast.success(t.updated);
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="gpa">GPA</Label>
          <Input
            id="gpa"
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder={t.eg("3.8")}
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sat">SAT</Label>
          <Input
            id="sat"
            type="number"
            step="1"
            min="400"
            max="1600"
            placeholder={t.eg("1450")}
            value={satScore}
            onChange={(e) => setSatScore(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="act">ACT</Label>
          <Input
            id="act"
            type="number"
            step="1"
            min="1"
            max="36"
            placeholder={t.eg("32")}
            value={actScore}
            onChange={(e) => setActScore(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ielts">IELTS</Label>
          <Input
            id="ielts"
            type="number"
            step="0.5"
            min="0"
            max="9"
            placeholder={t.eg("7.5")}
            value={ieltsScore}
            onChange={(e) => setIeltsScore(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="toefl">TOEFL</Label>
          <Input
            id="toefl"
            type="number"
            step="1"
            min="0"
            max="120"
            placeholder={t.eg("100")}
            value={toeflScore}
            onChange={(e) => setToeflScore(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ent">{t.ent}</Label>
          <Input
            id="ent"
            type="number"
            step="1"
            min="0"
            max="140"
            placeholder={t.eg("125")}
            value={entScore}
            onChange={(e) => setEntScore(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : null}
            {t.save}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
