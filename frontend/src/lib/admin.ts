import "server-only";
import { env } from "@/lib/env.server";

/**
 * Whether a signed-in user is a platform administrator.
 *
 * The app has no role table: admin is an allow-list of email addresses in
 * `ADMIN_EMAILS`. An unset/empty list means nobody is an admin, so the program
 * catalog stays read-only until someone is deliberately named.
 *
 * The address must also be *verified*. Email/password sign-up does not prove
 * ownership of the address, so without this check anyone could register
 * `admin@…` with a password before the real admin ever signed in and inherit
 * the role. Google and Apple sign-ins arrive verified.
 */
export function isAdminUser(
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined,
): boolean {
  if (!user?.email || user.emailVerified !== true) return false;

  const allowed = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(user.email.trim().toLowerCase());
}
