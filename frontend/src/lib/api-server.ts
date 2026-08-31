import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env.server";
import { requestJson } from "@/lib/api-request";

/**
 * Mints one short-lived JWT per server request rather than one per API call.
 *
 * A dashboard render makes several backend calls; each used to sign its own
 * token, and because every token differs, each outgoing fetch also carried a
 * different `Authorization` header — which defeated Next's request
 * memoization on top of the redundant signing. One token per request is both
 * cheaper and what makes deduplication upstream actually possible.
 */
const getBearerToken = cache(async (): Promise<string | null> => {
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
});

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

  return requestJson<T>(`${env.NEXT_PUBLIC_API_URL}${path}`, init, token);
}
