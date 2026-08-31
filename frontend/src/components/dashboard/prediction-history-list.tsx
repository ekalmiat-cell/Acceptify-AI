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

export function PredictionHistoryList({
  predictions,
  universities,
}: {
  predictions: PredictionHistoryEntry[];
  universities: University[];
}) {
  const rows = [...predictions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction history</CardTitle>
          <CardDescription>Your most recent reports — tell us how they turned out</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">No predictions yet</p>
            <p className="text-sm text-muted-foreground">
              Run your first AI match prediction to see it show up here.
            </p>
          </div>
          <Button render={<Link href="/dashboard/universities" />} size="sm" className="mt-1">
            Run new prediction
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prediction history</CardTitle>
        <CardDescription>Your most recent reports — tell us how they turned out</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">University</TableHead>
              <TableHead>Fit score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead className="pr-4 text-right">Date</TableHead>
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
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.65rem] font-semibold">
                        {university.logoInitials}
                      </span>
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
                    <Badge variant="outline">{entry.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {/* The one column that can ever tell us whether the score
                        above it was right — see lib/predictions-client.ts. */}
                    <ReportOutcomeMenu predictionId={entry.id} outcome={entry.outcome} />
                  </TableCell>
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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
