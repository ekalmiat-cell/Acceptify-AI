import { adminEmails, adminStatus } from "@/lib/admin";
import { getSession } from "@/lib/session";
import { HttpError, json, route } from "@/lib/route";

export const dynamic = "force-dynamic";

/**
 * Signed-in self-check: "why don't I see the admin page?" Reports only the
 * caller's own email and verification state, and the allow-list with each
 * address masked (the admin address is the public contact email anyway).
 */
export const GET = route(async () => {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Sign in first.");

  const mask = (email: string) => email.replace(/^(.{2})[^@]*/, "$1***");

  return json({
    you: { email: session.user.email, emailVerified: session.user.emailVerified },
    status: adminStatus(session.user),
    allowList: adminEmails().map(mask),
  });
});
