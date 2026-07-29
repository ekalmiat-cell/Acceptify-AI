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
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
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
export function formatOAuthCallbackError(code: string | undefined): string | null {
  if (!code) return null;

  switch (code) {
    case "account_not_linked":
      return "That email is already registered with a different sign-in method. Sign in that way first, then link this provider.";
    case "state_mismatch":
    case "please_restart_the_process":
      return "The sign-in session expired before it finished. Please try again.";
    case "access_denied":
      return "You cancelled the sign-in request.";
    default:
      return "We couldn't finish signing you in with that provider. Please try again.";
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

export function formatAuthError(
  errorMessage: string | undefined,
  fallback: string,
): string {
  const message = errorMessage?.trim();

  if (!message) {
    return fallback;
  }

  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("provider not found") ||
    lowerMessage.includes("oauth provider")
  ) {
    return "That sign-in provider is not configured yet on this app.";
  }

  if (
    lowerMessage.includes("connect") ||
    lowerMessage.includes("econnrefused") ||
    lowerMessage.includes("database") ||
    lowerMessage.includes("relation")
  ) {
    return "Authentication is currently unavailable. Make sure Postgres is running and the auth tables were created.";
  }

  if (lowerMessage.includes("already") && lowerMessage.includes("exists")) {
    return "An account with this email already exists.";
  }

  if (lowerMessage.includes("invalid") && lowerMessage.includes("password")) {
    return "Invalid email or password.";
  }

  return message;
}
