"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EssayInputForm } from "@/components/dashboard/essays/essay-input-form";
import { EssayLoadingState } from "@/components/dashboard/essays/essay-loading-state";
import { EssayAnalysisView } from "@/components/dashboard/essays/essay-analysis-view";
import { EssayHistoryDrawer } from "@/components/dashboard/essays/essay-history-drawer";
import {
  analyzeEssay,
  deleteEssayReview,
  getEssayReview,
} from "@/lib/essays-client";
import { describeApiError } from "@/lib/api-error";
import type { University } from "@/types/domain";
import type {
  EssayAnalyzeRequest,
  EssayReviewRead,
  EssayReviewSummaryRead,
} from "@/types/essay";

interface EssayReviewerViewProps {
  universities: University[];
  initialHistory: EssayReviewSummaryRead[];
  initialReview?: EssayReviewRead | null;
  initialUniversityId?: string | null;
}

export function EssayReviewerView({
  universities,
  initialHistory,
  initialReview,
  initialUniversityId,
}: EssayReviewerViewProps) {
  const [history, setHistory] = useState<EssayReviewSummaryRead[]>(initialHistory);
  const [currentReview, setCurrentReview] = useState<EssayReviewRead | null>(
    initialReview ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const targetUniversity = universities.find(
    (u) => u.id === currentReview?.university_id
  );

  const handleAnalyze = async (payload: EssayAnalyzeRequest) => {
    setIsLoading(true);
    try {
      const review = await analyzeEssay(payload);
      setCurrentReview(review);

      // Add to history list immediately
      const summary: EssayReviewSummaryRead = {
        id: review.id,
        university_id: review.university_id,
        program_id: review.program_id,
        title: review.title,
        prompt_text: review.prompt_text,
        word_count: review.word_count,
        essay_snippet: review.essay_snippet,
        overall_score: review.overall_score,
        created_at: review.created_at,
      };
      setHistory((prev) => [summary, ...prev.filter((h) => h.id !== review.id)]);
      toast.success("Essay analysis complete!");
    } catch (err) {
      toast.error(describeApiError(err, "Failed to analyze essay. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectReview = async (id: string) => {
    setIsLoading(true);
    try {
      const review = await getEssayReview(id);
      setCurrentReview(review);
    } catch (err) {
      toast.error(describeApiError(err, "Could not load past essay review."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    setIsDeletingId(id);
    try {
      await deleteEssayReview(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (currentReview?.id === id) {
        setCurrentReview(null);
      }
      toast.success("Essay review deleted.");
    } catch (err) {
      toast.error(describeApiError(err, "Failed to delete review."));
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            AI Essay Reviewer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Expert admissions critique, rhetoric evaluation, cliché detection, and prompt alignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentReview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentReview(null)}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Editor</span>
            </Button>
          )}

          <EssayHistoryDrawer
            history={history}
            onSelectReview={handleSelectReview}
            onDeleteReview={handleDeleteReview}
            isDeletingId={isDeletingId}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <EssayLoadingState />
      ) : currentReview ? (
        <EssayAnalysisView
          review={currentReview}
          onReset={() => setCurrentReview(null)}
          universityName={targetUniversity?.name}
        />
      ) : (
        <EssayInputForm
          universities={universities}
          onSubmit={handleAnalyze}
          isLoading={isLoading}
          initialUniversityId={initialUniversityId}
        />
      )}
    </div>
  );
}
