import "server-only";

import { pgPool } from "@/lib/db";

/**
 * The beta funnel for the admin page: how far invited students get. Counts
 * people, never shows who they are.
 */
export interface BetaStats {
  users: number;
  newLast7Days: number;
  activeLast7Days: number;
  withProfile: number;
  withAnalysis: number;
  withEssay: number;
  signupsByDay: { day: string; count: number }[];
}

export async function getBetaStats(): Promise<BetaStats> {
  const [totals, daily] = await Promise.all([
    pgPool.query<{
      users: string;
      new_last_7_days: string;
      active_last_7_days: string;
      with_profile: string;
      with_analysis: string;
      with_essay: string;
    }>(`
      SELECT
        (SELECT count(*) FROM "user") AS users,
        (SELECT count(*) FROM "user" WHERE "createdAt" > now() - interval '7 days') AS new_last_7_days,
        (SELECT count(DISTINCT "userId") FROM "session"
          WHERE "updatedAt" > now() - interval '7 days') AS active_last_7_days,
        (SELECT count(*) FROM student_profiles
          WHERE coalesce(gpa::text, sat_score::text, act_score::text, ent_score::text,
                         ielts_score::text, toefl_score::text) IS NOT NULL) AS with_profile,
        (SELECT count(DISTINCT user_id) FROM predictions) AS with_analysis,
        (SELECT count(DISTINCT user_id) FROM essay_reviews) AS with_essay
    `),
    pgPool.query<{ day: string; count: string }>(`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, count(*) AS count
      FROM "user"
      WHERE "createdAt" > now() - interval '14 days'
      GROUP BY 1
      ORDER BY 1
    `),
  ]);

  const row = totals.rows[0];
  return {
    users: Number(row.users),
    newLast7Days: Number(row.new_last_7_days),
    activeLast7Days: Number(row.active_last_7_days),
    withProfile: Number(row.with_profile),
    withAnalysis: Number(row.with_analysis),
    withEssay: Number(row.with_essay),
    signupsByDay: daily.rows.map((r) => ({ day: r.day, count: Number(r.count) })),
  };
}
