import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Route prefixes that require an authenticated session. Empty for now — the
 * foundation ships no protected routes yet. Add prefixes here as real
 * features land (e.g. "/dashboard", "/applications").
 *
 * This only performs an optimistic cookie presence check (no DB call), which
 * is the correct/fast pattern for edge middleware. Routes still must verify
 * the session server-side (via lib/auth.ts) before trusting it.
 */
const PROTECTED_PATH_PREFIXES: string[] = ["/dashboard"];

export function middleware(request: NextRequest) {
  const isProtected = PROTECTED_PATH_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
