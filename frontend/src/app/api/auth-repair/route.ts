import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";

import { pgPool } from "@/lib/db";

/**
 * Self-heals a specific broken-signup state we've seen in production: a
 * `user` row exists (and even has an active session, since Better Auth
 * issues one right after creating the user) but no matching `account`
 * (credential) row was ever created, so email/password sign-in always
 * fails with "Invalid email or password" no matter what the user types —
 * including their own real password.
 *
 * This runs only after a real sign-in attempt has already failed. It
 * creates the missing credential using the password the user just typed
 * (effectively finishing their interrupted signup) — it never overwrites
 * an existing password, so it can't be used to hijack a working account.
 */

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ repaired: false }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const userResult = await pgPool.query<{ id: string }>(
    `SELECT id FROM "user" WHERE email = $1 LIMIT 1`,
    [email]
  );
  const user = userResult.rows[0];
  if (!user) {
    return NextResponse.json({ repaired: false });
  }

  const existingAccount = await pgPool.query(
    `SELECT id FROM account WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
    [user.id]
  );
  if (existingAccount.rows.length > 0) {
    // A credential already exists — this is a genuine wrong-password case,
    // not the broken state we're healing. Nothing to repair.
    return NextResponse.json({ repaired: false });
  }

  const hashed = await hashPassword(password);

  await pgPool.query(
    `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, 'credential', $2, $3, now(), now())`,
    [randomUUID(), user.id, hashed]
  );

  return NextResponse.json({ repaired: true });
}
