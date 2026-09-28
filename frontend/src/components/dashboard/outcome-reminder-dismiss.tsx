"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { OUTCOME_REMINDER_SNOOZE_COOKIE, OUTCOME_REMINDER_SNOOZE_SECONDS } from "@/lib/outcome-reminder";

const copy = defineCopy({
  en: { later: "Remind me in a month" },
  ru: { later: "Напомнить через месяц" },
});

/** Hides the outcome reminder for a month. */
export function OutcomeReminderDismiss() {
  const t = useCopy(copy);
  const router = useRouter();

  function snooze() {
    document.cookie = `${OUTCOME_REMINDER_SNOOZE_COOKIE}=1; path=/; max-age=${OUTCOME_REMINDER_SNOOZE_SECONDS}; samesite=lax`;
    router.refresh();
  }

  return (
    <Button variant="ghost" size="icon-sm" onClick={snooze} aria-label={t.later} title={t.later}>
      <X />
    </Button>
  );
}
