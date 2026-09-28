"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Loader2, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { achievementCatalog } from "@/data/achievement-catalog";
import { criterionName, groupName } from "@/lib/catalog-copy";
import { ACADEMIC_CRITERIA, DEFAULT_WEIGHTS, type CriterionKey } from "@/lib/criteria";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { saveEvaluationProfile } from "@/lib/programs-client";
import type { EvaluationProfile, Program, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";

const CATALOG_GROUPS = ["Credentials", "Competitions", "Activities", "Talents"] as const;

const copy = defineCopy({
  en: {
    saved: (name: string) => `${name} evaluation weights saved`,
    failed: "Could not save evaluation weights.",
    back: (university: string) => `${university} programs`,
    title: (name: string) => `${name} — Evaluation weights`,
    intro: (program: string, university: string) =>
      `Every admission criterion, weighted specifically for ${program} at ${university}. Higher weight = more influence on the fit score. A weight of 0 means the criterion is ignored for this program.`,
    academic: "Academic scores",
    academicNote: "GPA, standardized test scores, and language exams.",
    totalBefore: "Total weight across all criteria:",
    totalAfter:
      "— weights don't need to sum to any specific number; the score is renormalized over whichever criteria a student has actually filled in.",
    reset: "Reset to defaults",
    save: "Save weights",
  },
  ru: {
    saved: (name: string) => `Веса программы «${name}» сохранены`,
    failed: "Не удалось сохранить веса.",
    back: (university: string) => `Программы ${university}`,
    title: (name: string) => `${name} — веса оценки`,
    intro: (program: string, university: string) =>
      `Все критерии поступления с весами именно для программы «${program}» в ${university}. Чем больше вес, тем сильнее критерий влияет на балл соответствия. Вес 0 значит, что критерий не учитывается.`,
    academic: "Академические баллы",
    academicNote: "GPA, стандартизированные тесты и языковые экзамены.",
    totalBefore: "Суммарный вес всех критериев:",
    totalAfter:
      "— сумма не обязана быть каким-то числом: оценка пересчитывается по тем критериям, которые ученик действительно заполнил.",
    reset: "Сбросить к стандартным",
    save: "Сохранить веса",
  },
});

export function AdminWeightEditor({
  university,
  program,
  evaluationProfile,
}: {
  university: University;
  program: Program;
  evaluationProfile: EvaluationProfile | null;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();

  const initialWeights = useMemo(() => {
    const map: Partial<Record<CriterionKey, number>> = { ...DEFAULT_WEIGHTS };
    for (const entry of evaluationProfile?.weights ?? []) {
      map[entry.criterionKey as CriterionKey] = entry.weight;
    }
    return map;
  }, [evaluationProfile]);

  const [weights, setWeights] = useState(initialWeights);
  const [isSaving, setIsSaving] = useState(false);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + (w ?? 0), 0);

  function setWeight(criterion: CriterionKey, value: number) {
    setWeights((prev) => ({ ...prev, [criterion]: value }));
  }

  function resetToDefaults() {
    setWeights({ ...DEFAULT_WEIGHTS });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await saveEvaluationProfile(program.id, {
        name: `${program.name} — evaluation profile`,
        weights: Object.entries(weights).map(([criterionKey, weight]) => ({
          criterionKey,
          weight: weight ?? 0,
        })),
      });
      toast.success(t.saved(program.name));
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/dashboard/admin/${university.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {t.back(university.shortName)}
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {t.title(program.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{t.intro(program.name, university.name)}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.academic}</CardTitle>
          <CardDescription>{t.academicNote}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ACADEMIC_CRITERIA.map((criterion) => (
            <WeightField
              key={criterion}
              label={criterionName(criterion, locale)}
              value={weights[criterion] ?? 0}
              onChange={(v) => setWeight(criterion, v)}
            />
          ))}
        </CardContent>
      </Card>

      {CATALOG_GROUPS.map((group) => {
        const items = achievementCatalog.filter((item) => item.group === group);
        if (items.length === 0) return null;
        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle>{groupName(group, locale)}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <WeightField
                  key={item.id}
                  label={criterionName(item.id, locale)}
                  value={weights[item.id as CriterionKey] ?? 0}
                  onChange={(v) => setWeight(item.id as CriterionKey, v)}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm text-muted-foreground">
          {t.totalBefore}{" "}
          <span className="font-mono font-medium text-foreground">{totalWeight.toFixed(1)}</span>{" "}
          {t.totalAfter}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
            <RotateCcw />
            {t.reset}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {t.save}
          </Button>
        </div>
      </div>
    </div>
  );
}

function WeightField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type="number"
        step="0.5"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
