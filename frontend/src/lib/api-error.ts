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

  if (error.status === 401 || error.status === 403) {
    return "Your session expired. Sign in again to save your changes.";
  }

  if (error.status >= 500) {
    return `${fallback} The server returned an error (${error.status}) — check the backend logs.`;
  }

  const detail = error.message?.trim();
  return detail ? `${fallback} ${detail}` : fallback;
}
