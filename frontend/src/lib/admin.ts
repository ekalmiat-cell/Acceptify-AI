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
/**
 * The allow-list, lower-cased. Pulls the addresses out of whatever was pasted
 * into the dashboard — "a@x.com, b@y.com", "Name <a@x.com>", quotes, or
 * invisible characters copied along with the text — instead of trusting the
 * separators to be exactly right.
 */
export function adminEmails(): string[] {
  const value = (env.ADMIN_EMAILS ?? "").normalize("NFKC");
  return (value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []).map((email) =>
    email.toLowerCase(),
  );
}

/** Why a user is or is not an admin — for the signed-in self-check route. */
export function adminStatus(
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined,
): "admin" | "email-not-verified" | "not-on-allow-list" | "allow-list-empty" {
  if (adminEmails().length === 0) return "allow-list-empty";
  if (!user?.email || !adminEmails().includes(user.email.trim().toLowerCase())) {
    return "not-on-allow-list";
  }
  if (user.emailVerified !== true) return "email-not-verified";
  return "admin";
}

export function isAdminUser(
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined,
): boolean {
  if (!user?.email || user.emailVerified !== true) return false;

  return adminEmails().includes(user.email.trim().toLowerCase());
}
