/**
 * Streak and daily-goal arithmetic for the training course. Days are UTC
 * calendar dates ("2026-09-28"), the same day the AI limits use. Pure.
 */

/** Drills a day that count as "today's practice done". */
export const DAILY_GOAL = 3;

export interface TrainingProgress {
  /** Ids of every drill the student has finished at least once. */
  completed: string[];
  /** Consecutive days with at least one finished drill, up to today. */
  streak: number;
  /** Drills finished today. */
  today: number;
}

export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function previousDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return utcDay(date);
}

/**
 * Days in a row with practice, counting back from today — or from yesterday,
 * so a streak isn't shown as broken before today's drill is done.
 */
export function currentStreak(days: Iterable<string>, today: string): number {
  const practised = new Set(days);
  let day = practised.has(today) ? today : previousDay(today);
  let streak = 0;
  while (practised.has(day)) {
    streak++;
    day = previousDay(day);
  }
  return streak;
}
