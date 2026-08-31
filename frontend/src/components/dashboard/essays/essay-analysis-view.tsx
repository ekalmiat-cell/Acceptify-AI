"use client";

import { useState } from "react";
import {
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { EssayScoreOverview } from "@/components/dashboard/essays/essay-score-overview";
import { EssayStrengthsWeaknesses } from "@/components/dashboard/essays/essay-strengths-weaknesses";
import { EssayClicheDetector } from "@/components/dashboard/essays/essay-cliche-detector";
import { EssayAlignmentCard } from "@/components/dashboard/essays/essay-alignment-card";
import { EssayRecommendationsList } from "@/components/dashboard/essays/essay-recommendations-list";
import type { EssayReviewRead } from "@/types/essay";

interface EssayAnalysisViewProps {
  review: EssayReviewRead;
  onReset: () => void;
  universityName?: string | null;
}

export function EssayAnalysisView({
  review,
  onReset,
  universityName,
}: EssayAnalysisViewProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = review.analysis_result;

  const handleCopyFeedback = () => {
    const textToCopy = `=== Acceptify AI Essay Review ===
Title: ${review.title}
Overall Score: ${result.overall_score}/100
Verdict: ${result.headline_verdict}

Category Breakdown:
- Voice & Authenticity: ${result.category_scores.voice_and_authenticity}%
- Storytelling: ${result.category_scores.storytelling}%
- Structure: ${result.category_scores.structure}%
- Clarity & Tone: ${result.category_scores.clarity_and_flow}%
- Grammar & Mechanics: ${result.category_scores.grammar_and_mechanics}%

Key Strengths:
${result.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Areas for Growth:
${result.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

Next Steps:
${result.suggested_next_steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Essay evaluation summary copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {review.title || "Admissions Essay Review"}
            </h2>
            {universityName && (
              <Badge variant="secondary" className="gap-1 font-normal text-xs">
                <Building className="h-3 w-3" />
                {universityName}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{review.word_count} words</span>
            <span>•</span>
            <span>Reviewed {new Date(review.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleCopyFeedback} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Feedback"}</span>
          </Button>

          <Button size="sm" onClick={onReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Review Another Draft</span>
          </Button>
        </div>
      </div>

      {/* Submitted Draft Accordion */}
      <div className="rounded-xl border bg-muted/20 p-4 transition-all">
        <button
          type="button"
          onClick={() => setShowFullText(!showFullText)}
          className="flex w-full items-center justify-between text-left text-xs font-semibold text-foreground/80 hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Submitted Essay Draft ({review.word_count} words)</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span>{showFullText ? "Hide text" : "Show full text"}</span>
            {showFullText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showFullText ? (
          <div className="mt-4 pt-4 border-t text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-serif bg-background p-4 rounded-lg border">
            {review.essay_text}
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {review.essay_snippet}
          </p>
        )}
      </div>

      {/* 1. Score Overview */}
      <EssayScoreOverview
        overallScore={result.overall_score}
        headlineVerdict={result.headline_verdict}
        categoryScores={result.category_scores}
      />

      {/* 2. Strengths and Weaknesses */}
      <EssayStrengthsWeaknesses
        strengths={result.strengths}
        weaknesses={result.weaknesses}
      />

      {/* 3. Clichés Detector */}
      <EssayClicheDetector cliches={result.cliches_detected} />

      {/* 4. University & Prompt Alignment */}
      <EssayAlignmentCard
        promptAlignment={result.prompt_alignment}
        universityAlignment={result.university_alignment}
        universityName={universityName}
      />

      {/* 5. Actionable Recommendations & Next Steps */}
      <EssayRecommendationsList
        recommendations={result.actionable_recommendations}
        nextSteps={result.suggested_next_steps}
      />
    </div>
  );
}
