"use client";

import { Building, FileText, Check, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { PromptAlignment, UniversityAlignment } from "@/types/essay";

interface EssayAlignmentCardProps {
  promptAlignment: PromptAlignment;
  universityAlignment: UniversityAlignment;
  universityName?: string | null;
}

export function EssayAlignmentCard({
  promptAlignment,
  universityAlignment,
  universityName,
}: EssayAlignmentCardProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Prompt Adherence */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Prompt Adherence</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {promptAlignment.score}%
              </span>
            </div>
          </div>
          <Progress value={promptAlignment.score} className="h-1.5 mt-2" />
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {promptAlignment.assessment}
          </p>

          {promptAlignment.missing_elements && promptAlignment.missing_elements.length > 0 && (
            <div className="rounded-md border border-amber-200/80 bg-amber-50/50 p-3 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="mb-1.5 flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Unaddressed Prompt Elements</span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                {promptAlignment.missing_elements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* University Alignment & Culture */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <Building className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                {universityName ? `${universityName} Fit` : "Institutional Fit"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {universityAlignment.score}%
              </span>
            </div>
          </div>
          <Progress value={universityAlignment.score} className="h-1.5 mt-2" />
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {universityAlignment.assessment}
          </p>

          {universityAlignment.aligned_values && universityAlignment.aligned_values.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground">Demonstrated Values:</span>
              <div className="flex flex-wrap gap-1.5">
                {universityAlignment.aligned_values.map((val, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-0.5 text-xs font-normal"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                    {val}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
