import "server-only";
import { env } from "@/lib/env.server";

/**
 * Platform administrators.
 *
 * The app has no role table: admin is an allow-list of email addresses — the
 * founder's own address, fixed here so the admin page never depends on a
 * variable typed into the Vercel dashboard, plus anyone named in
 * `ADMIN_EMAILS`.
 *
 * The address must also be *verified*. Email/password sign-up does not prove
 * ownership of the address, so without this check anyone could register
 * `admin@…` with a password before the real admin ever signed in and inherit
 * the role. Google and Apple sign-ins arrive verified.
 */
const OWNER_EMAIL = "ekalmiat@gmail.com";

type MaybeUser = { email?: string | null; emailVerified?: boolean | null } | null | undefined;

/**
 * The allow-list, lower-cased. Pulls the addresses out of whatever was pasted
 * into ADMIN_EMAILS — "a@x.com, b@y.com", "Name <a@x.com>", quotes, or
 * invisible characters copied along with the text — instead of trusting the
 * separators to be exactly right.
 */
export function adminEmails(): string[] {
  const value = (env.ADMIN_EMAILS ?? "").normalize("NFKC");
  const listed = (value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) ?? []).map((email) =>
    email.toLowerCase(),
  );
  return Array.from(new Set([OWNER_EMAIL, ...listed]));
}

/** Why a user is or is not an admin — for the signed-in self-check route. */
export function adminStatus(user: MaybeUser): "admin" | "email-not-verified" | "not-on-allow-list" {
  if (!user?.email || !adminEmails().includes(user.email.trim().toLowerCase())) {
    return "not-on-allow-list";
  }
  if (user.emailVerified !== true) return "email-not-verified";
  return "admin";
}

export function isAdminUser(user: MaybeUser): boolean {
  return adminStatus(user) === "admin";
}
