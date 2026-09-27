import type { CriterionKey, EssayFlags, ScoreCap } from "@/lib/essay-rubric";

export interface CategoryScores {
  structure: number;
  storytelling: number;
  voice_and_authenticity: number;
  clarity_and_flow: number;
  grammar_and_mechanics: number;
}

export interface ClicheItem {
  quote: string;
  issue: string;
  replacement_idea: string;
}

export interface PromptAlignment {
  score: number;
  assessment: string;
  missing_elements: string[];
}

export interface UniversityAlignment {
  score: number;
  assessment: string;
  aligned_values: string[];
}

export interface ActionableRecommendation {
  priority: "high" | "medium" | "low";
  category: string;
  advice: string;
  example_improvement?: string | null;
}

/** First-generation review, still stored in older history entries. */
export interface EssayAnalysisResult {
  overall_score: number;
  headline_verdict: string;
  category_scores: CategoryScores;
  strengths: string[];
  weaknesses: string[];
  cliches_detected: ClicheItem[];
  prompt_alignment: PromptAlignment;
  university_alignment: UniversityAlignment;
  actionable_recommendations: ActionableRecommendation[];
  suggested_next_steps: string[];
}

// ── Rubric-based review (version 2) ─────────────────────────────────────

export type ParagraphRole =
  | "hook"
  | "context"
  | "story"
  | "turning_point"
  | "reflection"
  | "conclusion"
  | "other";

export type LineFeedbackType =
  | "cliche"
  | "vague"
  | "telling"
  | "passive"
  | "wordy"
  | "grammar"
  | "strong";

export interface CriterionResult {
  score: number;
  /** What in the essay earned this score, quoting it where possible. */
  evidence: string;
  /** The single most useful improvement for this criterion. */
  to_improve: string;
}

export interface ParagraphNote {
  paragraph: number;
  role: ParagraphRole;
  strength: "strong" | "adequate" | "weak";
  note: string;
}

export interface LineFeedback {
  /** Copied exactly from the essay, so the UI can highlight it. */
  quote: string;
  type: LineFeedbackType;
  comment: string;
  suggestion: string;
  /** A rewrite of this one sentence only — an example, never the essay. */
  example: string | null;
}

export interface PathStep {
  change: string;
  why: string;
  criterion: CriterionKey;
  estimated_gain: number;
}

export type FeedbackLanguage = "en" | "ru";

export interface EssayReviewV2 {
  version: 2;
  /** Computed from the criteria by lib/essay-rubric.ts, after caps. */
  overall_score: number;
  /** The weighted score before any cap. */
  weighted_score: number;
  cap: ScoreCap | null;
  headline_verdict: string;
  /** What the reader understood the essay to be about. */
  essay_summary: string;
  criteria: Record<CriterionKey, CriterionResult>;
  flags: EssayFlags;
  paragraph_map: ParagraphNote[];
  line_feedback: LineFeedback[];
  strengths: string[];
  path_to_90: PathStep[];
  university_fit: {
    score: number;
    assessment: string;
    aligned_values: string[];
    gaps: string[];
  } | null;
  revision: {
    previous_score: number;
    improved: string[];
    still_to_fix: string[];
  } | null;
  feedback_language: FeedbackLanguage;
}

export type AnyEssayAnalysis = EssayAnalysisResult | EssayReviewV2;

export function isReviewV2(analysis: AnyEssayAnalysis): analysis is EssayReviewV2 {
  return (analysis as EssayReviewV2).version === 2;
}

export interface EssayAnalyzeRequest {
  title: string;
  essay_text: string;
  university_id?: string | null;
  program_id?: string | null;
  prompt_text?: string | null;
  include_profile_context?: boolean;
  /** The review of the previous draft, when this is a revision. */
  parent_id?: string | null;
  feedback_language?: FeedbackLanguage;
}

export interface EssayReviewRead {
  id: string;
  user_id: string;
  university_id: string | null;
  program_id: string | null;
  title: string;
  prompt_text: string | null;
  word_count: number;
  essay_snippet: string;
  essay_text: string;
  analysis_result: AnyEssayAnalysis;
  overall_score: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EssayReviewSummaryRead {
  id: string;
  university_id: string | null;
  program_id: string | null;
  title: string;
  prompt_text: string | null;
  word_count: number;
  essay_snippet: string;
  overall_score: number;
  parent_id: string | null;
  created_at: string;
}
