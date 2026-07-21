"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { updateAcademicProfile } from "@/lib/profile-client";
import type { AcademicProfile } from "@/types/domain";

export function SetDreamUniversityButton({
  academic,
  universityId,
}: {
  academic: AcademicProfile;
  universityId: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const isDream = academic.dreamUniversityId === universityId;

  async function handleClick() {
    setIsSaving(true);
    try {
      await updateAcademicProfile({
        ...academic,
        dreamUniversityId: isDream ? null : universityId,
      });
      toast.success(isDream ? "Removed as dream university" : "Set as your dream university");
      router.refresh();
    } catch {
      toast.error("Could not update your dream university.");
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
      {isDream ? "Dream university" : "Set as dream university"}
    </Button>
  );
}
