"use client";

import { authClient } from "@/lib/auth-client";
import { clientEnv } from "@/lib/env.client";
import { ApiError } from "@/lib/api-error";

async function getBearerToken(): Promise<string | null> {
  const { data } = await authClient.token();
  return data?.token ?? null;
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

  const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.detail ?? res.statusText,
      body ?? undefined
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
