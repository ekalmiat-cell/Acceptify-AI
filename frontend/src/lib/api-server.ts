import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env.server";
import { ApiError } from "@/lib/api-error";

async function getBearerToken(): Promise<string | null> {
  try {
    const headersList = await headers();
    // `session.token` is Better Auth's own opaque session token — the
    // backend expects a signed JWT (verified against /api/auth/jwks), which
    // the jwt plugin's `/token` endpoint mints from the current session.
    const { token } = await auth.api.getToken({ headers: headersList });
    return token ?? null;
  } catch {
    return null;
  }
}

/**
 * Server-side counterpart to lib/api-client.ts, for use in server
 * components, route handlers, and server actions. Reads the session from
 * the incoming request's cookies (via next/headers) rather than a client
 * session store.
 */
export async function apiFetchServer<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getBearerToken();

  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
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
