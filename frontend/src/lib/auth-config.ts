export type SocialProvidersConfig = {
  google: boolean;
  apple: boolean;
};

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
    return "Google and Apple sign-in are not configured yet on this app.";
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
