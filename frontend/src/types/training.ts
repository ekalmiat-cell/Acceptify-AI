import type { TrainingProgress } from "@/lib/training/progress";

export type { TrainingProgress };

export interface DrillFeedback {
  verdict: "strong" | "close" | "not_yet";
  works: string;
  fix: string;
  better_phrase: string | null;
}

export interface DrillFeedbackResponse {
  feedback: DrillFeedback;
  /** AI coach notes left today, after this one. */
  left: number;
}
