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
import { revalidateReferenceData } from "@/lib/reference-actions";

export function FieldOfStudySelect({
  university,
  profile,
}: {
  university: University;
  profile: AcademicProfile;
}) {
  const router = useRouter();
  const [field, setField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleContinue() {
    if (!field) return;
    setIsSaving(true);
    try {
      const program = await resolveProgram(university.id, field);
      await updateAcademicProfile({ ...profile, dreamProgramId: program.id });
      toast.success(`Evaluation model tuned for ${field} at ${university.shortName}`);
      router.push("/dashboard/analysis");
      await revalidateReferenceData();
      router.refresh();
    } catch (error) {
      toast.error(describeApiError(error, "Could not save your intended field of study."));
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Choose Your Intended Field of Study
          </h1>
          <p className="text-sm text-muted-foreground">
            Select the academic field you plan to apply for at {university.name}. Acceptify AI will
            adjust its evaluation model specifically for your chosen program.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fields of study</CardTitle>
          <CardDescription>Pick the one field that best matches your intended program.</CardDescription>
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
                  <span className="truncate">{option}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={handleContinue} disabled={!field || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
