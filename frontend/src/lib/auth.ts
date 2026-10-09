import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { pgPool } from "@/lib/db";
import { env } from "@/lib/env.server";
import { siteConfig } from "@/config/site";
import { deleteUserData } from "@/lib/data/account";
import { isMailDeliverable, rememberDevLink, sendEmail } from "@/lib/email";
import { offerResetLink } from "@/lib/reset-link-capture";
import { defineCopy, DEFAULT_LOCALE } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

/** Account emails in the language the visitor was using when they asked. */
const mail = defineCopy({
  en: {
    resetSubject: `Reset your ${siteConfig.name} password`,
    resetText: (url: string) =>
      `Someone asked to reset the password for your ${siteConfig.name} account.\n\nOpen this link within the next hour to choose a new one:\n${url}\n\nIf this wasn't you, ignore this email — your password stays unchanged.`,
    resetHtml: (url: string) =>
      `<p>Someone asked to reset the password for your ${siteConfig.name} account.</p><p><a href="${url}">Choose a new password</a> — the link works for one hour.</p><p>If this wasn't you, ignore this email; your password stays unchanged.</p>`,
    verifySubject: `Confirm your email for ${siteConfig.name}`,
    verifyText: (url: string) =>
      `Welcome to ${siteConfig.name}!\n\nConfirm your email address by opening this link:\n${url}\n\nIf you didn't create an account, ignore this email.`,
    verifyHtml: (url: string) =>
      `<p>Welcome to ${siteConfig.name}!</p><p><a href="${url}">Confirm your email address</a></p><p>If you didn't create an account, ignore this email.</p>`,
  },
  ru: {
    resetSubject: `Сброс пароля ${siteConfig.name}`,
    resetText: (url: string) =>
      `Кто-то запросил сброс пароля для твоего аккаунта ${siteConfig.name}.\n\nОткрой эту ссылку в течение часа, чтобы задать новый пароль:\n${url}\n\nЕсли запрос сделан не тобой, просто проигнорируй письмо — пароль не изменится.`,
    resetHtml: (url: string) =>
      `<p>Кто-то запросил сброс пароля для твоего аккаунта ${siteConfig.name}.</p><p><a href="${url}">Задать новый пароль</a> — ссылка действует час.</p><p>Если запрос сделан не тобой, просто проигнорируй письмо — пароль не изменится.</p>`,
    verifySubject: `Подтверди почту для ${siteConfig.name}`,
    verifyText: (url: string) =>
      `Добро пожаловать в ${siteConfig.name}!\n\nПодтверди адрес почты по этой ссылке:\n${url}\n\nЕсли аккаунт создан не тобой, просто проигнорируй письмо.`,
    verifyHtml: (url: string) =>
      `<p>Добро пожаловать в ${siteConfig.name}!</p><p><a href="${url}">Подтвердить почту</a></p><p>Если аккаунт создан не тобой, просто проигнорируй письмо.</p>`,
  },
});

async function mailCopy() {
  return mail[await getLocale().catch(() => DEFAULT_LOCALE)];
}

/**
 * Better Auth is the system of record for identity: it owns the user,
 * session, account and verification tables and handles email/password and
 * OAuth entirely inside this Next.js app. The app's own API routes read the
 * signed-in user from the same session cookie (see lib/session.ts) — there is
 * no separate backend and no bearer token to trust.
 */

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * The public origin of this deployment. An explicit BETTER_AUTH_URL wins;
 * otherwise Vercel's own variables describe where we are running: the
 * production domain in production, the unique deployment URL on previews.
 */
function resolveBaseUrl(): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

const baseURL = resolveBaseUrl();

function toOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const candidate = value.includes("://") ? value : `https://${value}`;
  try {
    return new URL(candidate).origin;
  } catch {
    return null;
  }
}

/**
 * Origins allowed to call the auth endpoints — Better Auth's CSRF defence.
 *
 * A fixed list on purpose. It must never be derived from the incoming
 * request's own Origin/Host headers: those are supplied by whoever sends the
 * request, so trusting them would trust every site on the internet.
 */
const trustedOrigins = [
  baseURL,
  env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ...(env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
  // The project's production domain.
  "https://acceptify-ai.vercel.app",
  // Sign in with Apple returns via a cross-origin form_post from Apple.
  "https://appleid.apple.com",
  ...(isDevelopment ? ["http://localhost:3000", "http://127.0.0.1:3000"] : []),
]
  .map((value) => toOrigin(value?.trim()))
  .filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  appName: siteConfig.name,
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  database: pgPool,
  trustedOrigins: Array.from(new Set(trustedOrigins)),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // Signing in must work even before an email provider is configured, so
    // verification is encouraged (a link is sent when mail is set up) but not
    // required. Unverified addresses are never auto-linked to Google/Apple
    // sign-ins, and never granted admin (see lib/admin.ts).
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    /**
     * Better Auth calls this with a single-use link that opens
     * /reset-password?token=…. Without a mail provider the link is logged on
     * the server (and, in development only, shown on the page) instead.
     */
    sendResetPassword: async ({ user, url }) => {
      // An admin generating a link to pass on by hand (Telegram support).
      if (offerResetLink(url)) return;
      rememberDevLink(user.email, url);
      const t = await mailCopy();
      await sendEmail({
        to: user.email,
        subject: t.resetSubject,
        text: t.resetText(url),
        html: t.resetHtml(url),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: isMailDeliverable(),
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const t = await mailCopy();
      await sendEmail({
        to: user.email,
        subject: t.verifySubject,
        text: t.verifyText(url),
        html: t.verifyHtml(url),
      });
    },
  },
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            prompt: "select_account" as const,
          },
        }
      : {}),
    ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: env.APPLE_CLIENT_ID,
            clientSecret: env.APPLE_CLIENT_SECRET,
            appBundleIdentifier: env.APPLE_APP_BUNDLE_IDENTIFIER,
          },
        }
      : {}),
  },
  user: {
    /**
     * Self-service account deletion from Settings → Account. Better Auth asks
     * for the password (email accounts) or a session younger than a day
     * (Google/Apple), then removes the user, sessions and linked accounts;
     * beforeDelete wipes the profile, predictions, essays and AI usage first.
     */
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteUserData(user.id);
      },
    },
  },
  account: {
    /**
     * Someone who signed up with email/password and later clicks "Continue
     * with Google" lands in their existing account — but only once that
     * account's email is verified (Better Auth's `requireLocalEmailVerified`
     * default). Otherwise anyone could pre-register a victim's address with
     * a password and share the account after the victim signs in with Google.
     */
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "apple"],
    },
  },
  session: {
    // Students stay signed in: each day they use the site pushes expiry 90
    // days out again, so only three months away signs them out.
    expiresIn: 60 * 60 * 24 * 90, // 90 days
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
  // Built-in brute-force protection on sign-in, sign-up and password reset,
  // stored in Postgres so it holds across serverless instances.
  rateLimit: {
    enabled: true,
    storage: "database",
  },
  plugins: [
    // Must stay last: lets server actions set session cookies correctly.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
