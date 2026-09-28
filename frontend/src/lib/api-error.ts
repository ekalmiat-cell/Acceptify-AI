import { currentLocale } from "@/lib/i18n/browser";
import { defineCopy } from "@/lib/i18n/core";

const copy = defineCopy({
  en: {
    sessionExpired: "Your session expired. Sign in again to save your changes.",
    serverError: (status: number) => `The server returned an error (${status}). Please try again.`,
  },
  ru: {
    sessionExpired: "Сессия истекла. Войди снова, чтобы сохранить изменения.",
    serverError: (status: number) => `Сервер вернул ошибку (${status}). Попробуй ещё раз.`,
  },
});

/** Status used for failures that never reached the API at all. */
export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Turns a caught error into something worth showing in a toast.
 *
 * The point is that the reason survives: a swallowed cause is why a missing
 * database column could only ever say "Could not update your academic
 * profile" while the server was actually returning a 500.
 */
export function describeApiError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  // Already a human sentence from the transport ("Can't reach the API…").
  if (error.status === NETWORK_ERROR_STATUS) {
    return error.message;
  }

  if (error.status === 401) {
    return copy[currentLocale()].sessionExpired;
  }

  // The API's own `{ detail }` sentences are written to be shown as they are
  // ("AI features are not set up…", "You've reached the limit…"). Anything
  // else — a proxy's HTML error page, a bare status text — is not.
  const hasServerDetail =
    typeof error.body === "object" && error.body !== null && "detail" in error.body;
  const detail = error.message?.trim();

  if (hasServerDetail && detail) {
    return error.status >= 500 || error.status === 429 ? detail : `${fallback} ${detail}`;
  }

  if (error.status >= 500) {
    return `${fallback} ${copy[currentLocale()].serverError(error.status)}`;
  }

  return fallback;
}
