"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EssayStrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export function EssayStrengthsWeaknesses({
  strengths,
  weaknesses,
}: EssayStrengthsWeaknessesProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* Key Strengths */}
      <Card className="border-emerald-200/60 bg-emerald-50/20 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-emerald-950 dark:text-emerald-200">
              Key Strengths ({strengths.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {strengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Growth / Revision */}
      <Card className="border-amber-200/60 bg-amber-50/20 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-amber-950 dark:text-amber-200">
              Core Revision Areas ({weaknesses.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {weaknesses.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
