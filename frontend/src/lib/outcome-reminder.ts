import type { PredictionHistoryEntry } from "@/types/domain";

/** A prediction this fresh can't have a decision behind it yet. */
export const OUTCOME_REMINDER_MIN_AGE_DAYS = 21;

/** "Remind me in a month" — a cookie, so the server can skip the card without a flash. */
export const OUTCOME_REMINDER_SNOOZE_COOKIE = "acceptify-outcome-snooze";
export const OUTCOME_REMINDER_SNOOZE_SECONDS = 60 * 60 * 24 * 30;

/**
 * The applications worth asking "how did it go?" about: one per university
 * (its latest prediction), old enough that a decision may exist, and not yet
 * answered — for that university at all, since any reported outcome there
 * already tells us what we need.
 *
 * Outcomes are the only evidence that the fit score means anything (see
 * components/dashboard/report-outcome-menu.tsx), so the dashboard asks for
 * them instead of waiting for students to find the history table. Pure.
 */
export function pendingOutcomes(
  predictions: readonly PredictionHistoryEntry[],
  now: Date,
  limit = 4,
): PredictionHistoryEntry[] {
  const cutoff = now.getTime() - OUTCOME_REMINDER_MIN_AGE_DAYS * 24 * 60 * 60 * 1000;
  const answered = new Set(predictions.filter((p) => p.outcome).map((p) => p.universityId));

  const latest = new Map<string, PredictionHistoryEntry>();
  for (const prediction of predictions) {
    if (answered.has(prediction.universityId)) continue;
    const seen = latest.get(prediction.universityId);
    if (!seen || prediction.createdAt > seen.createdAt) latest.set(prediction.universityId, prediction);
  }

  return [...latest.values()]
    .filter((p) => new Date(p.createdAt).getTime() <= cutoff)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}
