import { Check, X } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { StudentProfileInput } from "@/lib/predict";
import type { University } from "@/types/domain";

const ACT_COMPETITIVE_BASELINE = 33;
const ENT_COMPETITIVE_BASELINE = 120;

export function RequirementsGap({
  university,
  profile,
}: {
  university: University;
  profile: StudentProfileInput;
}) {
  const checks = [
    profile.gpa != null && {
      label: "GPA",
      met: profile.gpa >= university.minGpa,
      detail: `${profile.gpa.toFixed(2)} vs. ${university.minGpa.toFixed(2)} min.`,
    },
    profile.satScore != null && {
      label: "SAT score",
      met: profile.satScore >= university.satLow,
      detail: `${profile.satScore} vs. ${university.satLow}-${university.satHigh} range`,
    },
    profile.actScore != null && {
      label: "ACT score",
      met: profile.actScore >= ACT_COMPETITIVE_BASELINE,
      detail: `${profile.actScore} vs. ~${ACT_COMPETITIVE_BASELINE} competitive baseline`,
    },
    profile.ieltsScore != null && {
      label: "IELTS band",
      met: profile.ieltsScore >= university.ieltsMin,
      detail: `${profile.ieltsScore.toFixed(1)} vs. ${university.ieltsMin.toFixed(1)} min.`,
    },
    profile.toeflScore != null && {
      label: "TOEFL score",
      met: profile.toeflScore >= university.toeflMin,
      detail: `${profile.toeflScore} vs. ${university.toeflMin} min.`,
    },
    profile.entScore != null && {
      label: "National exam (ENT)",
      met: profile.entScore >= ENT_COMPETITIVE_BASELINE,
      detail: `${profile.entScore} vs. ~${ENT_COMPETITIVE_BASELINE} competitive baseline`,
    },
  ].filter((check): check is { label: string; met: boolean; detail: string } => Boolean(check));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requirements gap</CardTitle>
        <CardDescription>Your profile vs. this university&apos;s stated bar</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex items-center gap-2.5">
              <span
                className={
                  check.met
                    ? "flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "flex size-6 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }
              >
                {check.met ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <span className="text-sm font-medium">{check.label}</span>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{check.detail}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
