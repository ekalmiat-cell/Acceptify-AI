"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { CategoryScores } from "@/types/essay";

interface EssayScoreOverviewProps {
  overallScore: number;
  headlineVerdict: string;
  categoryScores: CategoryScores;
}

const CATEGORY_META: {
  key: keyof CategoryScores;
  label: string;
  description: string;
}[] = [
  {
    key: "voice_and_authenticity",
    label: "Voice & Authenticity",
    description: "Distinct personal voice, originality, honesty",
  },
  {
    key: "storytelling",
    label: "Storytelling & Impact",
    description: "Narrative arc, emotional resonance, show vs. tell",
  },
  {
    key: "structure",
    label: "Structure & Pacing",
    description: "Logical organization, transitions, paragraph flow",
  },
  {
    key: "clarity_and_flow",
    label: "Clarity & Tone",
    description: "Readability, vocabulary precision, cadence",
  },
  {
    key: "grammar_and_mechanics",
    label: "Grammar & Mechanics",
    description: "Syntax, punctuation, sentence variety",
  },
];

function getScoreTier(score: number): { label: string; color: string; bg: string } {
  if (score >= 85) {
    return {
      label: "Highly Competitive",
      color: "text-emerald-700 dark:text-emerald-400",
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
    };
  }
  if (score >= 70) {
    return {
      label: "Solid Foundation",
      color: "text-blue-700 dark:text-blue-400",
      bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
    };
  }
  if (score >= 50) {
    return {
      label: "Promising / Needs Revision",
      color: "text-amber-700 dark:text-amber-400",
      bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
    };
  }
  return {
    label: "Early Draft / Major Rework",
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300",
  };
}

export function EssayScoreOverview({
  overallScore,
  headlineVerdict,
  categoryScores,
}: EssayScoreOverviewProps) {
  const tier = getScoreTier(overallScore);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Overall Score Card */}
      <Card className="flex flex-col justify-between border shadow-sm lg:col-span-4 bg-gradient-to-b from-card to-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Overall Essay Quality
            </span>
            <Badge variant="outline" className={tier.bg}>
              {tier.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-extrabold tracking-tight text-foreground">
              {overallScore}
            </span>
            <span className="text-xl font-medium text-muted-foreground">/ 100</span>
          </div>

          <div className="rounded-lg border bg-background/80 p-3.5 text-sm text-foreground/90 backdrop-blur-sm">
            <div className="mb-1.5 flex items-center gap-1.5 font-medium text-xs text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Admissions Committee Impression</span>
            </div>
            <p className="leading-relaxed text-muted-foreground text-xs sm:text-sm">
              {headlineVerdict}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores Breakdown */}
      <Card className="border shadow-sm lg:col-span-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Criteria Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CATEGORY_META.map((cat) => {
            const score = categoryScores[cat.key] ?? 0;
            return (
              <div key={cat.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <span className="font-medium text-foreground">{cat.label}</span>
                    <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                      ({cat.description})
                    </span>
                  </div>
                  <span className="font-semibold text-foreground">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
