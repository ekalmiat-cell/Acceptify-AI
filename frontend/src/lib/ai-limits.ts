/**
 * Per-user daily ceilings on the AI features, shared by the server (which
 * enforces them in lib/data/ai-usage.ts) and the UI (which shows what is
 * left). Gemini's free tier gives the whole site only about 20 requests per
 * model per day, so these keep one busy student from using it up for all.
 * The day is the database's calendar day (UTC).
 */
export const AI_LIMITS = {
  essay_review: { perDay: 3 },
  copilot: { perDay: 20 },
  /** Spoken turns with Ars. Replies are a few sentences, so each is cheap. */
  copilot_voice: { perDay: 10 },
  training_feedback: { perDay: 3 },
} as const;

export type AiFeature = keyof typeof AI_LIMITS;

export const AI_REVIEWS_PER_DAY = AI_LIMITS.essay_review.perDay;
export const AI_COACH_PER_DAY = AI_LIMITS.training_feedback.perDay;
