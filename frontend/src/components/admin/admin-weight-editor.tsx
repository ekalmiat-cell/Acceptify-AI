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
import {
  ACADEMIC_CRITERIA,
  ACADEMIC_CRITERION_LABELS,
  DEFAULT_WEIGHTS,
  type CriterionKey,
} from "@/lib/criteria";
import { saveEvaluationProfile } from "@/lib/programs-client";
import type { EvaluationProfile, Program, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { revalidateReferenceData } from "@/lib/reference-actions";

const CATALOG_GROUPS = ["Credentials", "Competitions", "Activities", "Talents"] as const;

function labelFor(criterion: CriterionKey): string {
  if (criterion in ACADEMIC_CRITERION_LABELS) {
    return ACADEMIC_CRITERION_LABELS[criterion as keyof typeof ACADEMIC_CRITERION_LABELS];
  }
  return achievementCatalog.find((item) => item.id === criterion)?.label ?? criterion;
}

export function AdminWeightEditor({
  university,
  program,
  evaluationProfile,
}: {
  university: University;
  program: Program;
  evaluationProfile: EvaluationProfile | null;
}) {
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
      toast.success(`${program.name} evaluation weights saved`);
      await revalidateReferenceData();
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, "Could not save evaluation weights."));
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
          {university.shortName} programs
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight">
          {program.name} — Evaluation weights
        </h1>
        <p className="text-sm text-muted-foreground">
          Every admission criterion, weighted specifically for {program.name} at {university.name}.
          Higher weight = more influence on the fit score. A weight of 0 means the
          criterion is ignored for this program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Academic scores</CardTitle>
          <CardDescription>GPA, standardized test scores, and language exams.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {ACADEMIC_CRITERIA.map((criterion) => (
            <WeightField
              key={criterion}
              label={labelFor(criterion)}
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
              <CardTitle>{group}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <WeightField
                  key={item.id}
                  label={item.label}
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
          Total weight across all criteria:{" "}
          <span className="font-mono font-medium text-foreground">{totalWeight.toFixed(1)}</span>{" "}
          — weights don&apos;t need to sum to any specific number; the score is renormalized over
          whichever criteria a student has actually filled in.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={resetToDefaults} disabled={isSaving}>
            <RotateCcw />
            Reset to defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            Save weights
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
