import Link from "next/link";
import { Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MatchBadge } from "@/components/shared/match-badge";
import { ReportOutcomeMenu } from "@/components/dashboard/report-outcome-menu";
import { getUniversityById } from "@/lib/universities";
import type { PredictionHistoryEntry, University } from "@/types/domain";
import { UniversityLogo } from "@/components/shared/university-logo";
import { statusName } from "@/lib/catalog-copy";
import { defineCopy, formatDate } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Prediction history",
    subtitle: "Your most recent reports — tell us how they turned out",
    none: "No predictions yet",
    noneNote: "Run your first AI match prediction to see it show up here.",
    run: "Run new prediction",
    university: "University",
    fit: "Fit score",
    status: "Status",
    outcome: "Outcome",
    date: "Date",
  },
  ru: {
    title: "История прогнозов",
    subtitle: "Твои последние отчёты — расскажи, чем всё закончилось",
    none: "Прогнозов пока нет",
    noneNote: "Сделай первый прогноз, и он появится здесь.",
    run: "Новый прогноз",
    university: "Университет",
    fit: "Соответствие",
    status: "Статус",
    outcome: "Результат",
    date: "Дата",
  },
});

export async function PredictionHistoryList({
  predictions,
  universities,
}: {
  predictions: PredictionHistoryEntry[];
  universities: University[];
}) {
  const locale = await getLocale();
  const t = copy[locale];
  const rows = [...predictions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">{t.none}</p>
            <p className="text-sm text-muted-foreground">{t.noneNote}</p>
          </div>
          <Button render={<Link href="/dashboard/universities" />} size="sm" className="mt-1">
            {t.run}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t.university}</TableHead>
              <TableHead>{t.fit}</TableHead>
              <TableHead>{t.status}</TableHead>
              <TableHead>{t.outcome}</TableHead>
              <TableHead className="pr-4 text-right">{t.date}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry) => {
              const university = getUniversityById(universities, entry.universityId);
              if (!university) return null;
              return (
                <TableRow key={entry.id}>
                  <TableCell className="pl-4">
                    <Link
                      href={`/dashboard/universities/${university.slug}`}
                      className="flex items-center gap-2.5 font-medium text-foreground hover:text-brand"
                    >
                      <UniversityLogo university={university} className="size-7 rounded-md p-0.5 text-[0.55rem]" />
                      {university.shortName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {entry.matchScore}
                      </span>
                      <MatchBadge category={entry.category} showLabel={false} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{statusName(entry.status, locale)}</Badge>
                  </TableCell>
                  <TableCell>
                    {/* The one column that can ever tell us whether the score
                        above it was right — see lib/predictions-client.ts. */}
                    <ReportOutcomeMenu predictionId={entry.id} outcome={entry.outcome} />
                  </TableCell>
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {formatDate(locale, entry.createdAt, { month: "short", day: "numeric" })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
