"use client";

import { authClient } from "@/lib/auth-client";
import { clientEnv } from "@/lib/env.client";
import { requestJson } from "@/lib/api-request";

async function getBearerToken(): Promise<string | null> {
  try {
    const { data } = await authClient.token();
    return data?.token ?? null;
  } catch {
    // Minting a token needs a round trip too. Failing here would throw a raw
    // "Failed to fetch"; carry on unauthenticated and let the backend answer
    // with a 401 the callers already know how to handle.
    return null;
  }
}

/**
 * Client-side fetch wrapper for the FastAPI backend. Attaches a short-lived
 * JWT minted from the current Better Auth session (see lib/auth.ts's `jwt`
 * plugin) as a Bearer token, so it only works for authenticated calls made
 * from client components. For server components/actions, use
 * `apiFetchServer` from lib/api-server.ts instead.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getBearerToken();

  return requestJson<T>(
    `${clientEnv.NEXT_PUBLIC_API_URL}${path}`,
    init,
    token
  );
}
