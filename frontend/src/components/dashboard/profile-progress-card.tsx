import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { getAcademicProfile, getAchievementRecords } from "@/lib/profile-server";
import { computeGroupProgress, computeProfileCompleteness, resolveAchievements } from "@/lib/profile";

export async function ProfileProgressCard() {
  const [academic, records] = await Promise.all([getAcademicProfile(), getAchievementRecords()]);
  const achievements = resolveAchievements(records);
  const completeness = computeProfileCompleteness(academic, achievements);
  const groupProgress = computeGroupProgress(academic, achievements);
  const totalAchieved = groupProgress.reduce((sum, g) => sum + g.achieved, 0);
  const totalItems = groupProgress.reduce((sum, g) => sum + g.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile completeness</CardTitle>
        <CardDescription>
          {totalAchieved} of {totalItems} categories completed
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Overall progress</span>
            <span className="font-mono text-muted-foreground">{completeness}%</span>
          </div>
          <Progress value={completeness}>
            <ProgressTrack>
              <ProgressIndicator className="bg-gradient-brand" />
            </ProgressTrack>
          </Progress>
        </div>

        <div className="flex flex-col gap-3">
          {groupProgress.map(({ group, achieved, total }) => {
            const pct = total > 0 ? Math.round((achieved / total) * 100) : 0;
            return (
              <div key={group} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-muted-foreground">{group}</span>
                <Progress value={pct} className="flex-1">
                  <ProgressTrack>
                    <ProgressIndicator />
                  </ProgressTrack>
                </Progress>
                <span className="w-8 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {achieved}/{total}
                </span>
              </div>
            );
          })}
        </div>

        <Button render={<Link href="/dashboard/profile" />} variant="outline" className="justify-center">
          Complete your profile
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
