import "server-only";

import { withTransaction } from "@/lib/db";

/**
 * Tables that hold a student's own data, keyed by Better Auth's user id.
 * They carry no foreign key to "user" (see 0001_initial_schema.sql), so
 * deleting the user row does not cascade into them — this does.
 */
const USER_DATA_TABLES = [
  "student_profiles",
  "achievements",
  "predictions",
  "essay_reviews",
  "ai_usage",
] as const;

/**
 * Removes everything the app stored for a user, in one transaction. Called by
 * Better Auth right before it deletes the user, session and account rows.
 */
export async function deleteUserData(userId: string): Promise<void> {
  await withTransaction(async (client) => {
    for (const table of USER_DATA_TABLES) {
      await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    }
  });
}
