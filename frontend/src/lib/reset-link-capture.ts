import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Lets the admin "create a reset link" route receive the link Better Auth
 * mints instead of it being emailed. Scoped to that one request through
 * AsyncLocalStorage: nothing is stored globally, and an ordinary "forgot
 * password" request is never captured.
 */
const capture = new AsyncLocalStorage<{ url: string | null }>();

/** Runs `work` and returns the reset link it produced, if any. */
export async function captureResetLink(work: () => Promise<unknown>): Promise<string | null> {
  const slot = { url: null as string | null };
  await capture.run(slot, work);
  return slot.url;
}

/**
 * Called from Better Auth's sendResetPassword. Returns true when an admin
 * request is capturing the link — the caller then must not email it.
 */
export function offerResetLink(url: string): boolean {
  const slot = capture.getStore();
  if (!slot) return false;
  slot.url = url;
  return true;
}
