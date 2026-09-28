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
import { defineCopy, formatDate, plural } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";
import type { EssayAnalysisResult, EssayReviewRead } from "@/types/essay";

const copy = defineCopy({
  en: {
    copyTitle: "=== Acceptify AI Essay Review ===",
    title: "Title",
    overall: "Overall score",
    verdict: "Verdict",
    categories: "Category breakdown",
    voice: "Voice & authenticity",
    storytelling: "Storytelling",
    structure: "Structure",
    clarity: "Clarity & tone",
    grammar: "Grammar & mechanics",
    strengths: "Key strengths",
    growth: "Areas for growth",
    nextSteps: "Next steps",
    copied: "Review summary copied",
    fallbackTitle: "Admissions essay review",
    words: (n: number) => `${n} words`,
    reviewed: (date: string) => `Reviewed ${date}`,
    copiedShort: "Copied",
    copyFeedback: "Copy feedback",
    another: "Review another draft",
    submitted: (words: string) => `Submitted draft (${words})`,
    hide: "Hide text",
    show: "Show full text",
  },
  ru: {
    copyTitle: "=== Разбор эссе Acceptify AI ===",
    title: "Название",
    overall: "Общая оценка",
    verdict: "Вердикт",
    categories: "Оценки по категориям",
    voice: "Голос и искренность",
    storytelling: "История",
    structure: "Структура",
    clarity: "Ясность и тон",
    grammar: "Грамматика",
    strengths: "Сильные стороны",
    growth: "Что улучшить",
    nextSteps: "Следующие шаги",
    copied: "Краткий разбор скопирован",
    fallbackTitle: "Разбор эссе для поступления",
    words: (n: number) => `${n} ${plural("ru", n, { one: "слово", few: "слова", many: "слов" })}`,
    reviewed: (date: string) => `Разобрано ${date}`,
    copiedShort: "Скопировано",
    copyFeedback: "Скопировать отзыв",
    another: "Разобрать другой черновик",
    submitted: (words: string) => `Отправленный черновик (${words})`,
    hide: "Скрыть текст",
    show: "Показать полностью",
  },
});

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
  const t = useCopy(copy);
  const locale = useLocale();
  const [showFullText, setShowFullText] = useState(false);
  const [copied, setCopied] = useState(false);

  // Only rendered for first-generation reviews in the history; newer ones
  // use the rubric view (essay-review-results.tsx).
  const result = review.analysis_result as EssayAnalysisResult;

  const handleCopyFeedback = () => {
    const textToCopy = `${t.copyTitle}
${t.title}: ${review.title}
${t.overall}: ${result.overall_score}/100
${t.verdict}: ${result.headline_verdict}

${t.categories}:
- ${t.voice}: ${result.category_scores.voice_and_authenticity}%
- ${t.storytelling}: ${result.category_scores.storytelling}%
- ${t.structure}: ${result.category_scores.structure}%
- ${t.clarity}: ${result.category_scores.clarity_and_flow}%
- ${t.grammar}: ${result.category_scores.grammar_and_mechanics}%

${t.strengths}:
${result.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${t.growth}:
${result.weaknesses.map((w, i) => `${i + 1}. ${w}`).join("\n")}

${t.nextSteps}:
${result.suggested_next_steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}
`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success(t.copied);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {review.title || t.fallbackTitle}
            </h2>
            {universityName && (
              <Badge variant="secondary" className="gap-1 font-normal text-xs">
                <Building className="h-3 w-3" />
                {universityName}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t.words(review.word_count)}</span>
            <span>•</span>
            <span>{t.reviewed(formatDate(locale, review.created_at))}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleCopyFeedback} className="gap-1.5 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? t.copiedShort : t.copyFeedback}</span>
          </Button>

          <Button size="sm" onClick={onReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.another}</span>
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
            <span>{t.submitted(t.words(review.word_count))}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <span>{showFullText ? t.hide : t.show}</span>
            {showFullText ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showFullText ? (
          <div lang="en" className="mt-4 pt-4 border-t text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed font-serif bg-background p-4 rounded-lg border">
            {review.essay_text}
          </div>
        ) : (
          <p lang="en" className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
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
