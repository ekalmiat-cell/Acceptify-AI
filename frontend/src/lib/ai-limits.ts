/**
 * Per-user daily ceilings on the AI features, shared by the server (which
 * enforces them in lib/data/ai-usage.ts) and the UI (which shows what is
 * left). The Gemini key is paid from a small monthly credit (~$8 spend cap),
 * so these keep one busy student from spending it for everyone. Essay
 * reviews are the expensive call; the rest run on Flash-Lite first.
 * The day is the database's calendar day (UTC).
 */
interface Limit {
  perDay: number;
  /** A higher ceiling for the admin, where they need one to try things out. */
  adminPerDay?: number;
}

export const AI_LIMITS = {
  essay_review: { perDay: 2 },
  copilot: { perDay: 10 },
  /** Spoken turns with Ars. Each is voiced by Gemini and paid per second, so students get half the admin's. */
  copilot_voice: { perDay: 5, adminPerDay: 10 },
  training_feedback: { perDay: 3 },
  /**
   * AI admission-chance estimates. Only a cache miss is counted: looking at
   * an estimate that was already made, by anyone, is free. The admin gets
   * more to look into odd results.
   */
  chance: { perDay: 12, adminPerDay: 60 },
} satisfies Record<string, Limit>;

export type AiFeature = keyof typeof AI_LIMITS;

/**
 * Daily ceilings for the whole site, all students together. The per-user
 * limits above stop one busy student; these stop many accounts (sign-up needs
 * no verified email) from adding up to more than the Gemini credit can pay
 * for. Sized for a few dozen active students; the admin is not held to them.
 */
export const SITE_AI_LIMITS: Record<AiFeature, number> = {
  essay_review: 100,
  copilot: 400,
  copilot_voice: 100,
  training_feedback: 200,
  chance: 300,
};

/** The day's allowance for one user. */
export function dailyLimit(feature: AiFeature, admin = false): number {
  const limit: Limit = AI_LIMITS[feature];
  return admin ? (limit.adminPerDay ?? limit.perDay) : limit.perDay;
}

export const AI_REVIEWS_PER_DAY = AI_LIMITS.essay_review.perDay;
export const AI_COACH_PER_DAY = AI_LIMITS.training_feedback.perDay;
