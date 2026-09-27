import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { pgPool } from "@/lib/db";
import { captureResetLink } from "@/lib/reset-link-capture";
import { HttpError, json, readJson, requireAdmin, route } from "@/lib/route";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ email: z.email("Enter a valid email address.") });

/**
 * Admin-only: mints a one-hour password reset link for a student so the
 * founder can send it on Telegram while email delivery has no domain. The
 * link is returned to the admin, never emailed.
 */
export const POST = route(async (request) => {
  await requireAdmin();
  const { email } = await readJson(request, bodySchema);

  const { rows } = await pgPool.query<{ has_password: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM "account" a
       WHERE a."userId" = u.id AND a."providerId" = 'credential'
     ) AS has_password
     FROM "user" u WHERE lower(u.email) = lower($1)`,
    [email],
  );

  if (rows.length === 0) {
    throw new HttpError(404, "No account uses this email.");
  }
  if (!rows[0].has_password) {
    throw new HttpError(
      409,
      "This account has no password — it signs in with Google or Apple. Ask them to use that button.",
    );
  }

  const requestHeaders = await headers();
  const url = await captureResetLink(() =>
    auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: requestHeaders,
    }),
  );

  if (!url) {
    throw new HttpError(500, "Better Auth did not produce a reset link.");
  }

  return json({ url, expiresInMinutes: 60 });
});
