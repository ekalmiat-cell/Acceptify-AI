"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    savedToast: (name: string) => `Saved ${name}`,
    removed: "Removed from saved list",
    saved: "Saved",
    save: "Save",
    appliedToast: (name: string) => `Marked ${name} as applied`,
    applied: "Applied",
    markApplied: "Mark as applied",
  },
  ru: {
    savedToast: (name: string) => `${name} сохранён в списке`,
    removed: "Убрано из сохранённых",
    saved: "Сохранено",
    save: "Сохранить",
    appliedToast: (name: string) => `${name}: заявка отмечена как поданная`,
    applied: "Заявка подана",
    markApplied: "Отметить: заявка подана",
  },
});

export function UniversityActions({ universityName }: { universityName: string }) {
  const t = useCopy(copy);
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={saved ? "secondary" : "outline"}
        onClick={() => {
          setSaved((prev) => {
            const next = !prev;
            toast.success(next ? t.savedToast(universityName) : t.removed);
            return next;
          });
        }}
      >
        {saved ? <BookmarkCheck /> : <Bookmark />}
        {saved ? t.saved : t.save}
      </Button>
      <Button
        variant={applied ? "secondary" : "default"}
        className={applied ? "" : "bg-gradient-brand text-white hover:opacity-90"}
        onClick={() => {
          setApplied((prev) => {
            const next = !prev;
            if (next) toast.success(t.appliedToast(universityName));
            return next;
          });
        }}
      >
        <CheckCircle2 />
        {applied ? t.applied : t.markApplied}
      </Button>
    </div>
  );
}
