import type { Locale } from "@/lib/i18n/core";

export type SocialProvider = "google" | "apple";

export type SocialProvidersConfig = Record<SocialProvider, boolean>;

/**
 * Which OAuth providers have credentials configured.
 *
 * SERVER ONLY: these are non-`NEXT_PUBLIC_` vars, so in a client component
 * every value would read as `undefined` and both providers would look
 * disabled. Call this from a server component and pass the resulting booleans
 * down as props (see the sign-in / sign-up pages).
 */
export function getConfiguredSocialProviders(): SocialProvidersConfig {
  return {
    google: Boolean(
      (process.env.GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_ID ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) &&
        (process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET),
    ),
    apple: Boolean(
      process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
    ),
  };
}

export const socialProviderLabels: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
};

/**
 * Maps the `?error=` code Better Auth appends when an OAuth round trip fails
 * onto something a person can act on.
 */
const OAUTH_ERRORS = {
  en: {
    notLinked:
      "That email is already registered with a different sign-in method. Sign in that way first, then link this provider.",
    expired: "The sign-in session expired before it finished. Please try again.",
    cancelled: "You cancelled the sign-in request.",
    other: "We couldn't finish signing you in with that provider. Please try again.",
  },
  ru: {
    notLinked: "Эта почта уже зарегистрирована с другим способом входа. Сначала войди им, а затем привяжи этот.",
    expired: "Сессия входа истекла, не успев завершиться. Попробуй ещё раз.",
    cancelled: "Вход был отменён.",
    other: "Не удалось завершить вход через этот сервис. Попробуй ещё раз.",
  },
} satisfies Record<Locale, unknown>;

export function formatOAuthCallbackError(code: string | undefined, locale: Locale = "en"): string | null {
  if (!code) return null;
  const t = OAUTH_ERRORS[locale];

  switch (code) {
    case "account_not_linked":
      return t.notLinked;
    case "state_mismatch":
    case "please_restart_the_process":
      return t.expired;
    case "access_denied":
      return t.cancelled;
    default:
      return t.other;
  }
}

/**
 * The middleware forwards the originally requested page as `?redirect=`.
 * Only same-origin absolute paths are honoured — `//evil.com` and
 * `https://evil.com` would otherwise turn the sign-in page into an open
 * redirect.
 */
export function sanitizeRedirectPath(
  value: string | undefined,
  fallback = "/dashboard",
): string {
  if (!value || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}

const AUTH_ERRORS = {
  en: {
    provider: "That sign-in provider is not configured yet on this app.",
    unavailable:
      "Authentication is currently unavailable. Make sure Postgres is running and the auth tables were created.",
    exists: "An account with this email already exists.",
    invalid: "Invalid email or password.",
    tooShort: "The password is too short.",
    tooMany: "Too many attempts. Wait a minute and try again.",
  },
  ru: {
    provider: "Этот способ входа ещё не подключён.",
    unavailable: "Вход сейчас недоступен. Попробуй чуть позже.",
    exists: "Аккаунт с такой почтой уже есть.",
    invalid: "Неверная почта или пароль.",
    tooShort: "Пароль слишком короткий.",
    tooMany: "Слишком много попыток. Подожди минуту и попробуй снова.",
  },
} satisfies Record<Locale, unknown>;

export function formatAuthError(
  errorMessage: string | undefined,
  fallback: string,
  locale: Locale = "en",
): string {
  const t = AUTH_ERRORS[locale];
  const message = errorMessage?.trim();

  if (!message) {
    return fallback;
  }

  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("provider not found") ||
    lowerMessage.includes("oauth provider")
  ) {
    return t.provider;
  }

  if (
    lowerMessage.includes("connect") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("database") ||
    lowerMessage.includes("relation")
  ) {
    return t.unavailable;
  }

  if (lowerMessage.includes("already") && lowerMessage.includes("exists")) {
    return t.exists;
  }

  if (lowerMessage.includes("invalid") && lowerMessage.includes("password")) {
    return t.invalid;
  }

  if (lowerMessage.includes("password") && lowerMessage.includes("short")) {
    return t.tooShort;
  }

  if (lowerMessage.includes("too many")) {
    return t.tooMany;
  }

  // Better Auth's own sentences are English; in Russian, the caller's
  // fallback reads better than a sentence in the wrong language.
  return locale === "en" ? message : fallback;
}
