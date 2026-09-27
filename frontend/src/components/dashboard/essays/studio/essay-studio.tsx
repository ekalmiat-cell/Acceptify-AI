"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { EssayAnalysisView } from "@/components/dashboard/essays/essay-analysis-view";
import { EssayHistoryDrawer } from "@/components/dashboard/essays/essay-history-drawer";
import { EssayLoadingState } from "@/components/dashboard/essays/essay-loading-state";
import { EssayEditor, type EssayDraft } from "@/components/dashboard/essays/studio/essay-editor";
import { EssayReviewResults } from "@/components/dashboard/essays/studio/essay-review-results";
import { StudioSidebar } from "@/components/dashboard/essays/studio/studio-sidebar";
import { Button } from "@/components/ui/button";
import { CUSTOM_PROMPT_ID, ESSAY_PROMPTS, findPrompt } from "@/data/essay-prompts";
import { AI_REVIEWS_PER_DAY } from "@/lib/ai-limits";
import { ApiError, describeApiError } from "@/lib/api-error";
import { checkEssay } from "@/lib/essay-check";
import { analyzeEssay, deleteEssayReview, getEssayReview } from "@/lib/essays-client";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";
import {
  isReviewV2,
  type EssayReviewRead,
  type EssayReviewSummaryRead,
  type FeedbackLanguage,
} from "@/types/essay";

/** The unsent draft lives in this browser only (a convenience, not storage). */
const DRAFT_KEY = "acceptify.essay-draft.v1";

interface StoredDraft extends EssayDraft {
  parentId: string | null;
  revisingScore: number | null;
}

function readStoredDraft(): StoredDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

function writeStoredDraft(draft: StoredDraft | null) {
  try {
    if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode or blocked storage: the draft simply isn't kept.
  }
}

function emptyDraft(universityId: string | null): EssayDraft {
  return { title: "", universityId, promptId: null, customPrompt: "", text: "" };
}

export function EssayStudio({
  universities,
  initialHistory,
  initialUniversityId,
  initialReviewsLeft,
}: {
  universities: University[];
  initialHistory: EssayReviewSummaryRead[];
  initialUniversityId: string | null;
  initialReviewsLeft: number;
}) {
  const [draft, setDraft] = useState<EssayDraft>(() => emptyDraft(initialUniversityId));
  const [parentId, setParentId] = useState<string | null>(null);
  const [revisingScore, setRevisingScore] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [liveCheck, setLiveCheck] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [includeProfile, setIncludeProfile] = useState(true);
  const [language, setLanguage] = useState<FeedbackLanguage>("en");
  const [reviewsLeft, setReviewsLeft] = useState(initialReviewsLeft);

  const [history, setHistory] = useState(initialHistory);
  const [currentReview, setCurrentReview] = useState<EssayReviewRead | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const restored = useRef(false);

  // Bring back an unsent draft after a reload.
  useEffect(() => {
    const stored = readStoredDraft();
    if (stored?.text) {
      const { parentId: storedParent, revisingScore: storedScore, ...rest } = stored;
      setDraft(rest);
      setParentId(storedParent);
      setRevisingScore(storedScore);
      setSavedLabel("Draft restored on this device");
    }
    restored.current = true;
  }, []);

  // Autosave, a moment after typing stops.
  useEffect(() => {
    if (!restored.current) return;
    const timer = setTimeout(() => {
      writeStoredDraft(draft.text ? { ...draft, parentId, revisingScore } : null);
      if (draft.text) setSavedLabel("Saved on this device");
    }, 700);
    return () => clearTimeout(timer);
  }, [draft, parentId, revisingScore]);

  // The check reads a deferred copy so typing never waits for it.
  const deferredText = useDeferredValue(draft.text);
  const check = useMemo(() => checkEssay(deferredText), [deferredText]);

  const university = universities.find((u) => u.id === draft.universityId) ?? null;
  const reviewUniversity = universities.find((u) => u.id === currentReview?.university_id) ?? null;

  const patch = (next: Partial<EssayDraft>) => setDraft((prev) => ({ ...prev, ...next }));

  async function handleReview() {
    const prompt = findPrompt(draft.promptId);
    const promptText =
      draft.promptId === CUSTOM_PROMPT_ID ? draft.customPrompt.trim() || null : (prompt?.text ?? null);

    setIsReviewing(true);
    try {
      const review = await analyzeEssay({
        title: draft.title.trim() || prompt?.label || "Untitled essay",
        essay_text: draft.text,
        university_id: draft.universityId,
        prompt_text: promptText,
        include_profile_context: includeProfile,
        parent_id: parentId,
        feedback_language: language,
      });
      setCurrentReview(review);
      setHistory((prev) => [toSummary(review), ...prev.filter((h) => h.id !== review.id)]);
      setReviewsLeft((n) => Math.max(0, n - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setReviewsLeft(0);
      toast.error(describeApiError(error, "The review didn't finish. Please try again."));
    } finally {
      setIsReviewing(false);
    }
  }

  function handleRevise(review: EssayReviewRead) {
    const match = ESSAY_PROMPTS.find((p) => p.text === review.prompt_text);
    setDraft({
      title: review.title,
      universityId: review.university_id,
      promptId: match ? match.id : review.prompt_text ? CUSTOM_PROMPT_ID : null,
      customPrompt: match ? "" : (review.prompt_text ?? ""),
      text: review.essay_text,
    });
    setParentId(review.id);
    setRevisingScore(review.overall_score);
    setCurrentReview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNewEssay() {
    setDraft(emptyDraft(initialUniversityId));
    setParentId(null);
    setRevisingScore(null);
    setSavedLabel(null);
    writeStoredDraft(null);
    setCurrentReview(null);
  }

  async function handleSelectReview(id: string) {
    setIsLoadingReview(true);
    try {
      setCurrentReview(await getEssayReview(id));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(describeApiError(error, "Couldn't open that review."));
    } finally {
      setIsLoadingReview(false);
    }
  }

  async function handleDeleteReview(id: string) {
    setDeletingId(id);
    try {
      await deleteEssayReview(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (currentReview?.id === id) setCurrentReview(null);
      if (parentId === id) {
        setParentId(null);
        setRevisingScore(null);
      }
      toast.success("Review deleted");
    } catch (error) {
      toast.error(describeApiError(error, "Couldn't delete that review."));
    } finally {
      setDeletingId(null);
    }
  }

  const showEditor = !currentReview && !isReviewing && !isLoadingReview;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow-brand">
              <Sparkles className="size-5" />
            </span>
            Essay Studio
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Paste or write your essay, fix the quick things as you go, then get an admissions-reader review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuotaDots left={reviewsLeft} />
          {currentReview ? (
            <Button variant="outline" size="sm" onClick={() => setCurrentReview(null)} className="gap-1.5">
              <ArrowLeft className="size-3.5" />
              Back to editor
            </Button>
          ) : null}
          <EssayHistoryDrawer
            history={history}
            onSelectReview={handleSelectReview}
            onDeleteReview={handleDeleteReview}
            isDeletingId={deletingId}
          />
        </div>
      </header>

      {isReviewing ? (
        <EssayLoadingState />
      ) : isLoadingReview ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Opening review…
        </div>
      ) : currentReview ? (
        isReviewV2(currentReview.analysis_result) ? (
          <EssayReviewResults
            review={currentReview}
            university={reviewUniversity}
            onRevise={() => handleRevise(currentReview)}
            onNewEssay={handleNewEssay}
          />
        ) : (
          <EssayAnalysisView
            review={currentReview}
            onReset={() => handleRevise(currentReview)}
            universityName={reviewUniversity?.name}
          />
        )
      ) : null}

      {showEditor ? (
        <div
          className={cn(
            "grid items-start gap-5",
            focusMode ? "mx-auto w-full max-w-4xl" : "lg:grid-cols-[minmax(0,1fr)_340px]",
          )}
        >
          <EssayEditor
            draft={draft}
            onChange={patch}
            universities={universities}
            check={check}
            liveCheck={liveCheck}
            onToggleLiveCheck={() => setLiveCheck((v) => !v)}
            focusMode={focusMode}
            onToggleFocus={() => setFocusMode((v) => !v)}
            savedLabel={savedLabel}
          />
          <div className={cn(focusMode ? "mx-auto w-full max-w-md" : "lg:sticky lg:top-20")}>
            <StudioSidebar
              university={university}
              check={check}
              liveCheck={liveCheck}
              includeProfile={includeProfile}
              onIncludeProfile={setIncludeProfile}
              language={language}
              onLanguage={setLanguage}
              reviewsLeft={reviewsLeft}
              revisingScore={revisingScore}
              isReviewing={isReviewing}
              onReview={handleReview}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuotaDots({ left }: { left: number }) {
  return (
    <div
      className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"
      title="AI reviews refill every day"
    >
      <div className="flex gap-[3px]">
        {Array.from({ length: AI_REVIEWS_PER_DAY }, (_, i) => (
          <span key={i} className={cn("h-3.5 w-2.5 rounded-sm", i < left ? "bg-brand" : "bg-muted")} />
        ))}
      </div>
      <span>
        <span className="font-semibold text-foreground">{left}</span> of {AI_REVIEWS_PER_DAY} reviews left today
      </span>
    </div>
  );
}

function toSummary(review: EssayReviewRead): EssayReviewSummaryRead {
  return {
    id: review.id,
    university_id: review.university_id,
    program_id: review.program_id,
    title: review.title,
    prompt_text: review.prompt_text,
    word_count: review.word_count,
    essay_snippet: review.essay_snippet,
    overall_score: review.overall_score,
    parent_id: review.parent_id,
    created_at: review.created_at,
  };
}
