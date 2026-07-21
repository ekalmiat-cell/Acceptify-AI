"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function UniversityActions({ universityName }: { universityName: string }) {
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={saved ? "secondary" : "outline"}
        onClick={() => {
          setSaved((prev) => {
            const next = !prev;
            toast.success(next ? `Saved ${universityName}` : `Removed from saved list`);
            return next;
          });
        }}
      >
        {saved ? <BookmarkCheck /> : <Bookmark />}
        {saved ? "Saved" : "Save"}
      </Button>
      <Button
        variant={applied ? "secondary" : "default"}
        className={applied ? "" : "bg-gradient-brand text-white hover:opacity-90"}
        onClick={() => {
          setApplied((prev) => {
            const next = !prev;
            if (next) toast.success(`Marked ${universityName} as applied`);
            return next;
          });
        }}
      >
        <CheckCircle2 />
        {applied ? "Applied" : "Mark as applied"}
      </Button>
    </div>
  );
}
