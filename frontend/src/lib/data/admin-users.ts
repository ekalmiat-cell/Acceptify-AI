import "server-only";

import { pgPool } from "@/lib/db";

/**
 * The people behind the beta funnel, for the admin page only: first name,
 * how they sign in, when they joined. Deliberately no email addresses — the
 * audience is mostly 18–19 and some are minors, and a name is enough to tell
 * who is who.
 */
export interface AdminUser {
  name: string;
  /** Sign-in methods, e.g. ["google"] or ["credential"]. */
  methods: string[];
  createdAt: string;
}

const MAX_LISTED = 300;

export async function listUsersForAdmin(): Promise<AdminUser[]> {
  const result = await pgPool.query<{ name: string; methods: string[]; created_at: Date }>(
    `SELECT u.name,
            coalesce(array_agg(DISTINCT a."providerId") FILTER (WHERE a."providerId" IS NOT NULL), '{}') AS methods,
            u."createdAt" AS created_at
     FROM "user" u
     LEFT JOIN "account" a ON a."userId" = u.id
     GROUP BY u.id
     ORDER BY u."createdAt" DESC
     LIMIT $1`,
    [MAX_LISTED],
  );
  return result.rows.map((row) => ({
    name: row.name,
    methods: row.methods,
    createdAt: row.created_at.toISOString(),
  }));
}
