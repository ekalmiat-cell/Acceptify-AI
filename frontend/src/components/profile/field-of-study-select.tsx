"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import { resolveProgram } from "@/lib/programs-client";
import { updateAcademicProfile } from "@/lib/profile-client";
import type { AcademicProfile, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { fieldName } from "@/lib/catalog-copy";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    tuned: (field: string, university: string) => `Evaluation model tuned for ${field} at ${university}`,
    failed: "Could not save your intended field of study.",
    title: "Choose your intended field of study",
    subtitle: (university: string) =>
      `Select the academic field you plan to apply for at ${university}. Acceptify AI will adjust its evaluation model specifically for your chosen program.`,
    fields: "Fields of study",
    fieldsNote: "Pick the one field that best matches your intended program.",
    continue: "Continue",
  },
  ru: {
    tuned: (field: string, university: string) => `Модель оценки настроена: ${field}, ${university}`,
    failed: "Не удалось сохранить направление обучения.",
    title: "Выбери направление обучения",
    subtitle: (university: string) =>
      `Выбери направление, на которое планируешь подавать в ${university}. Acceptify AI настроит модель оценки именно под эту программу.`,
    fields: "Направления",
    fieldsNote: "Выбери одно направление, которое лучше всего подходит под твою программу.",
    continue: "Продолжить",
  },
});

export function FieldOfStudySelect({
  university,
  profile,
}: {
  university: University;
  profile: AcademicProfile;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const router = useRouter();
  const [field, setField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleContinue() {
    if (!field) return;
    setIsSaving(true);
    try {
      const program = await resolveProgram(university.id, field);
      await updateAcademicProfile({ ...profile, dreamProgramId: program.id });
      toast.success(t.tuned(fieldName(field, locale), university.shortName));
      router.push("/dashboard/analysis");
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-muted-foreground">{t.subtitle(university.name)}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.fields}</CardTitle>
          <CardDescription>{t.fieldsNote}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {FIELDS_OF_STUDY.map((option) => {
              const isSelected = field === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setField(option)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    isSelected
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border text-foreground hover:border-brand/40 hover:bg-muted"
                  }`}
                >
                  {isSelected ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <span className="size-4 shrink-0 rounded-full border border-border" />
                  )}
                  <span className="truncate">{fieldName(option, locale)}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleContinue} disabled={!field || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              {t.continue}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
