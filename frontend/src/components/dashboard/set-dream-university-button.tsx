"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateAcademicProfile } from "@/lib/profile-client";
import type { AcademicProfile } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    removed: "Removed as dream university",
    set: "Set as your dream university",
    failed: "Could not update your dream university.",
    dream: "Dream university",
    setButton: "Set as dream university",
  },
  ru: {
    removed: "Университет больше не отмечен как мечта",
    set: "Теперь это твой университет мечты",
    failed: "Не удалось обновить университет мечты.",
    dream: "Университет мечты",
    setButton: "Сделать университетом мечты",
  },
});

export function SetDreamUniversityButton({
  academic,
  universityId,
}: {
  academic: AcademicProfile;
  universityId: string;
}) {
  const t = useCopy(copy);
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isDream = academic.dreamUniversityId === universityId;

  async function handleClick() {
    setIsSaving(true);
    try {
      await updateAcademicProfile({
        ...academic,
        dreamUniversityId: isDream ? null : universityId,
        dreamProgramId: isDream ? null : academic.dreamProgramId,
      });
      toast.success(isDream ? t.removed : t.set);
      if (isDream) {
        router.refresh();
      } else {
        router.push(`/dashboard/field-of-study?universityId=${universityId}`);
      }
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      variant={isDream ? "secondary" : "outline"}
      onClick={handleClick}
      disabled={isSaving}
    >
      {isSaving ? <Loader2 className="animate-spin" /> : isDream ? <Star className="fill-current" /> : <GraduationCap />}
      {isDream ? t.dream : t.setButton}
    </Button>
  );
}
