import "server-only";
import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * The current Better Auth session, read from the request's cookies — or
 * `null` when signed out or when the session cannot be read.
 *
 * Wrapped in `cache()` so a page, its layout and every loader it calls share
 * one lookup per request instead of each paying for its own.
 */
export const getSession = cache(async () => {
  // Outside the try on purpose: during a build, `headers()` throws the
  // signal that tells Next.js this page is per-request. Swallowing it would
  // let Next prerender the page once as "signed out" and serve that to all.
  const requestHeaders = await headers();
  try {
    return await auth.api.getSession({ headers: requestHeaders });
  } catch (error) {
    console.error("[session] could not read the session", error);
    return null;
  }
});

/** The signed-in user's id, or `null`. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}
