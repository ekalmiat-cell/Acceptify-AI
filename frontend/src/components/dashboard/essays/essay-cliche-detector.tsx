"use client";

import { AlertTriangle, CheckCircle, Lightbulb, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClicheItem } from "@/types/essay";

interface EssayClicheDetectorProps {
  cliches: ClicheItem[];
}

export function EssayClicheDetector({ cliches }: EssayClicheDetectorProps) {
  if (cliches.length === 0) {
    return (
      <Card className="border border-emerald-200/50 bg-emerald-50/15 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/10">
        <CardContent className="flex items-center gap-3.5 p-4 sm:p-5">
          <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Zero Clichés Detected</h4>
            <p className="text-xs text-muted-foreground">
              Your essay maintains a distinct, authentic voice without resorting to overused college essay tropes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-rose-200/60 bg-rose-50/20 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold text-rose-950 dark:text-rose-200">
              Cliché & Generic Phrase Detection ({cliches.length})
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300">
            Revision Recommended
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {cliches.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-rose-200/70 bg-background/95 p-4 text-xs sm:text-sm shadow-xs dark:border-rose-900/50"
          >
            {/* The Quote */}
            <div className="mb-2 flex items-start gap-2 text-rose-900 dark:text-rose-300">
              <Quote className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <blockquote className="font-medium italic leading-relaxed">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
            </div>

            {/* Why it's a cliché */}
            <div className="mb-2 text-muted-foreground text-xs leading-relaxed pl-6">
              <span className="font-semibold text-foreground">The Issue: </span>
              {item.issue}
            </div>

            {/* Replacement idea */}
            <div className="flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-foreground/90 pl-3">
              <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-semibold text-primary">Better Direction: </span>
                {item.replacement_idea}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
