import "server-only";
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { pgPool } from "@/lib/db";
import { env } from "@/lib/env.server";
import { siteConfig } from "@/config/site";
import { getConfiguredSocialProviders } from "@/lib/auth-config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const betterAuthUrl = process.env.BETTER_AUTH_URL || appUrl;
const betterAuthSecret = process.env.BETTER_AUTH_SECRET || "dev-secret-change-me-immediately";

const getTrustedOrigins = async (request?: Request) => {
  const origins = new Set<string>();

  const addOrigin = (value?: string) => {
    if (!value) return;

    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      const normalized = new URL(trimmed).origin;
      if (normalized) origins.add(normalized);
    } catch {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        origins.add(trimmed.replace(/\/$/, ""));
      }
    }
  };

  [appUrl, betterAuthUrl].forEach(addOrigin);

  process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach(addOrigin);

  if (request) {
    addOrigin(request.headers.get("origin") ?? undefined);

    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const hostHeader = request.headers.get("host") ?? request.headers.get("x-forwarded-host");

    if (hostHeader) {
      addOrigin(`${forwardedProto || "http"}://${hostHeader}`);
    }

    try {
      const requestUrl = new URL(request.url);
      addOrigin(requestUrl.origin);
    } catch {
      // Ignore malformed URLs and fall back to the configured origins.
    }
  }

  // Sign in with Apple returns the authorization via a cross-origin
  // `form_post` from appleid.apple.com, so that origin must be trusted or
  // Better Auth rejects the callback before it can create the session.
  origins.add("https://appleid.apple.com");

  [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://0.0.0.0:3001",
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://0.0.0.0:3000",
    "https://localhost:3001",
    "https://127.0.0.1:3001",
    "https://0.0.0.0:3001",
  ].forEach((origin) => origins.add(origin));

  return Array.from(origins);
};

/**
 * Better Auth is the system of record for identity: it owns the user,
 * session, account, and verification tables in Postgres and handles
 * email/password + OAuth entirely inside the Next.js app.
 *
 * The FastAPI backend never talks to these tables directly. Instead, the
 * `jwt` plugin below lets the frontend mint a short-lived signed JWT for the
 * current session (`GET /api/auth/token`), which the backend verifies against
 * the JWKS endpoint (`GET /api/auth/jwks`) exposed by this same instance.
 * See backend/app/core/security.py for the verification side.
 */
export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL: betterAuthUrl,
  secret: betterAuthSecret,
  database: pgPool,
  trustedOrigins: async (request) => getTrustedOrigins(request),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    ...(((process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID) &&
      (process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET))
      ? {
          google: {
            clientId: (process.env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID)!,
            clientSecret: (process.env.GOOGLE_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET)!,
            // Always let people choose which Google account to use instead of
            // silently reusing whichever one the browser is already signed in
            // to.
            prompt: "select_account" as const,
          },
        }
      : {}),
    ...(getConfiguredSocialProviders().apple && env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
            appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
          },
        }
      : {}),
  },
  account: {
    /**
     * Someone who signed up with email/password and later clicks "Continue
     * with Google" should land in their existing account, not hit an
     * "email already in use" wall. Google and Apple both assert a verified
     * email, so linking on a matching address is safe for them — an untrusted
     * provider would still require an explicit link from a signed-in session.
     */
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day of active use
    /**
     * Keeps a short-lived signed copy of the session in the cookie itself, so
     * ordinary page loads read the signed-in user without a database round
     * trip. It only caches — expiry and revocation still come from the
     * session table once the 5 minutes lapse.
     */
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  plugins: [
    jwt({
      jwt: {
        issuer: appUrl,
        audience: apiUrl,
        expirationTime: "15m",
        /**
         * Better Auth would otherwise put the whole user row on the token.
         * Pin it to what the backend actually needs: `sub` (set separately
         * from `user.id`) identifies the row owner, and `email` is what the
         * ADMIN_EMAILS allow-list is matched against — see
         * backend/app/core/security.py::get_current_admin_id.
         */
        definePayload: ({ user }) => ({
          id: user.id,
          email: user.email,
        }),
      },
    }),
    // Must stay last: lets server actions set session cookies correctly.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
