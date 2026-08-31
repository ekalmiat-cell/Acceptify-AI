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

export interface EssayAnalyzeRequest {
  title: string;
  essay_text: string;
  university_id?: string | null;
  program_id?: string | null;
  prompt_text?: string | null;
  include_profile_context?: boolean;
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
  analysis_result: EssayAnalysisResult;
  overall_score: number;
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
  created_at: string;
}
