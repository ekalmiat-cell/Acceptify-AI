/**
 * Per-user hourly ceilings on the AI features, shared by the server (which
 * enforces them in lib/data/ai-usage.ts) and the UI (which shows what is
 * left). Gemini's free tier is one quota for the whole deployment, so no
 * single user may exhaust it.
 */
export const AI_LIMITS = {
  essay_review: { perHour: 10 },
  copilot: { perHour: 40 },
} as const;

export type AiFeature = keyof typeof AI_LIMITS;

export const AI_REVIEWS_PER_HOUR = AI_LIMITS.essay_review.perHour;
