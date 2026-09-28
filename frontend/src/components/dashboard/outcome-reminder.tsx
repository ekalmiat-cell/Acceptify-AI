import Link from "next/link";
import { cookies } from "next/headers";
import { Trophy } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportOutcomeMenu } from "@/components/dashboard/report-outcome-menu";
import { OutcomeReminderDismiss } from "@/components/dashboard/outcome-reminder-dismiss";
import { UniversityLogo } from "@/components/shared/university-logo";
import { OUTCOME_REMINDER_SNOOZE_COOKIE, pendingOutcomes } from "@/lib/outcome-reminder";
import { getUniversityById } from "@/lib/universities";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import type { PredictionHistoryEntry, University } from "@/types/domain";

const copy = defineCopy({
  en: {
    title: "Heard back from universities?",
    description:
      "Mark how your applications turned out. Every real result makes the fit scores more accurate — for you and for everyone applying after you.",
  },
  ru: {
    title: "Уже знаешь результаты?",
    description:
      "Отметь, чем закончились заявки. Каждый реальный результат делает прогнозы точнее — для тебя и для всех, кто поступает после тебя.",
  },
});

/**
 * Asks for application outcomes on the dashboard, where students actually
 * look — not only in the history table. Shows nothing until a prediction is
 * old enough to have a decision behind it, and can be put off for a month.
 */
export async function OutcomeReminder({
  predictions,
  universities,
}: {
  predictions: PredictionHistoryEntry[];
  universities: University[];
}) {
  if ((await cookies()).has(OUTCOME_REMINDER_SNOOZE_COOKIE)) return null;

  const rows = pendingOutcomes(predictions, new Date()).flatMap((entry) => {
    const university = getUniversityById(universities, entry.universityId);
    return university ? [{ entry, university }] : [];
  });
  if (rows.length === 0) return null;

  const t = copy[await getLocale()];

  return (
    <Card className="border-brand/30">
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          <Trophy className="size-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.description}</CardDescription>
        </div>
        <OutcomeReminderDismiss />
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {rows.map(({ entry, university }) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <Link
                href={`/dashboard/universities/${university.slug}`}
                className="flex min-w-0 items-center gap-2.5 text-sm font-medium hover:text-brand"
              >
                <UniversityLogo university={university} className="size-7 rounded-md p-0.5 text-[0.55rem]" />
                <span className="truncate">{university.shortName}</span>
              </Link>
              <ReportOutcomeMenu predictionId={entry.id} outcome={entry.outcome} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
