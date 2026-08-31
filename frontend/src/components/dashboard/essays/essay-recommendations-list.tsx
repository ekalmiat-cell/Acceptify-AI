"use client";

import { CheckSquare, ArrowRight, ListChecks, ArrowUpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ActionableRecommendation } from "@/types/essay";

interface EssayRecommendationsListProps {
  recommendations: ActionableRecommendation[];
  nextSteps: string[];
}

function getPriorityBadge(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return (
        <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 text-xs">
          High Priority
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 text-xs">
          Medium Priority
        </Badge>
      );
    case "low":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 text-xs">
          Refinement
        </Badge>
      );
  }
}

export function EssayRecommendationsList({
  recommendations,
  nextSteps,
}: EssayRecommendationsListProps) {
  return (
    <div className="space-y-6">
      {/* Priority Recommendations */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-1.5 text-primary">
              <ListChecks className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-semibold">
              Actionable Revision Feedback ({recommendations.length})
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="rounded-lg border bg-card p-4 text-xs sm:text-sm shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{rec.category}</span>
                </div>
                {getPriorityBadge(rec.priority)}
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {rec.advice}
              </p>

              {rec.example_improvement && (
                <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs dark:bg-primary/10">
                  <span className="font-semibold text-primary block mb-1">
                    Example Implementation Idea:
                  </span>
                  <p className="italic text-foreground/90 leading-relaxed">
                    &ldquo;{rec.example_improvement}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommended Next Steps */}
      {nextSteps && nextSteps.length > 0 && (
        <Card className="border shadow-sm bg-gradient-to-r from-muted/30 to-muted/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                <ArrowUpCircle className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">Immediate Next Steps</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2.5">
              {nextSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed mt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
