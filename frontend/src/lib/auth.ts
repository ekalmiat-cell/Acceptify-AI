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
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  socialProviders: {
    ...(getConfiguredSocialProviders().google && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
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
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh once a day of active use
  },
  plugins: [
    jwt({
      jwt: {
        issuer: appUrl,
        audience: apiUrl,
        expirationTime: "15m",
      },
    }),
    // Must stay last: lets server actions set session cookies correctly.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
