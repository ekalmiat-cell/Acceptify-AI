"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { describeApiError } from "@/lib/api-error";
import { reportPredictionOutcome } from "@/lib/predictions-client";
import type { ApplicationOutcome } from "@/types/domain";

const OPTIONS: { value: ApplicationOutcome; label: string }[] = [
  { value: "admitted", label: "Admitted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "withdrawn", label: "Didn't apply / withdrew" },
];

const OUTCOME_STYLES: Record<ApplicationOutcome, string> = {
  admitted: "text-emerald-600 dark:text-emerald-400",
  rejected: "text-rose-600 dark:text-rose-400",
  waitlisted: "text-amber-600 dark:text-amber-400",
  withdrawn: "text-muted-foreground",
};

/**
 * Lets a student tell us how an application actually turned out.
 *
 * Small control, and the single most valuable one in the product: until
 * outcomes come back, every score the platform shows is an untested opinion,
 * and the methodology page has nothing to put against its own claims.
 *
 * A reported outcome stays editable. People tap the wrong row, and an outcome
 * that can't be corrected is worse than no outcome — it's a wrong label in
 * the calibration set that nobody can remove.
 */
export function ReportOutcomeMenu({
  predictionId,
  outcome,
}: {
  predictionId: string;
  outcome: ApplicationOutcome | null;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();

  const current = OPTIONS.find((option) => option.value === outcome) ?? null;

  async function handleSelect(next: ApplicationOutcome) {
    if (next === outcome) return;

    setIsSaving(true);
    try {
      await reportPredictionOutcome(predictionId, next);
      toast.success("Thanks — that outcome helps calibrate the model.");
      startRefresh(() => router.refresh());
    } catch (error) {
      toast.error(describeApiError(error, "Could not save that outcome."));
    } finally {
      setIsSaving(false);
    }
  }

  const busy = isSaving || isRefreshing;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" disabled={busy} />}
      >
        {busy ? <Loader2 className="animate-spin" /> : null}
        <span className={current ? OUTCOME_STYLES[current.value] : "text-muted-foreground"}>
          {current ? current.label : "Report outcome"}
        </span>
        <ChevronDown className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => handleSelect(option.value)}>
            <span className={OUTCOME_STYLES[option.value]}>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
