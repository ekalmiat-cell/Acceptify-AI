"use client";

import { requestJson } from "@/lib/api-request";

/**
 * Client-side fetch wrapper for this app's own `/api/v1/*` routes. Same
 * origin, so the browser attaches the Better Auth session cookie itself and
 * the route reads the user from it — nothing to mint, nothing to forward.
 * Server components do not use this; they call `lib/data/*` directly.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return requestJson<T>(path, init);
}
