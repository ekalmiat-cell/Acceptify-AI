import Link from "next/link";
import { GraduationCap, ListChecks, UserRound } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import type { University } from "@/types/domain";

export function QuickStatusRow({
  profileCompleteness,
  dreamUniversity,
  reportsCount,
}: {
  profileCompleteness: number;
  dreamUniversity: University | null;
  reportsCount: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Link href="/dashboard/profile">
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserRound className="size-4" />
              Profile completion
            </div>
            <p className="font-heading text-2xl font-semibold text-foreground">
              {profileCompleteness}%
            </p>
            <Progress value={profileCompleteness}>
              <ProgressTrack>
                <ProgressIndicator className="bg-gradient-brand" />
              </ProgressTrack>
            </Progress>
          </CardContent>
        </Card>
      </Link>

      <Link href={dreamUniversity ? `/dashboard/universities/${dreamUniversity.slug}` : "/dashboard/profile"}>
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="size-4" />
              Dream university
            </div>
            <p className="truncate font-heading text-lg font-semibold text-foreground">
              {dreamUniversity?.name ?? "Not selected yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {dreamUniversity ? `${dreamUniversity.city}, ${dreamUniversity.country}` : "Pick one from your profile"}
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/analysis">
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListChecks className="size-4" />
              Admission analysis
            </div>
            <p className="font-heading text-2xl font-semibold text-foreground">
              {reportsCount > 0 ? `${reportsCount} report${reportsCount === 1 ? "" : "s"}` : "Not started"}
            </p>
            <p className="text-xs text-muted-foreground">
              {reportsCount > 0 ? "View your latest analysis" : "Run your first admission analysis"}
            </p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
