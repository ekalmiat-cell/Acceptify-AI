import { ApiError, NETWORK_ERROR_STATUS } from "@/lib/api-error";

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * A dev backend started with `--reload` drops in-flight connections for a
 * moment every time a Python file is saved. One quiet retry turns that window
 * into a slightly slower request instead of a crashed screen.
 */
const RETRY_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Shared transport for both the client and server API wrappers. Deliberately
 * carries neither `client-only` nor `server-only` so each side can wrap it.
 *
 * The important behaviour here is that a dead or restarting backend surfaces
 * as an `ApiError` with status 0 and a sentence a person can act on, rather
 * than a bare `TypeError: Failed to fetch` blowing up in the error overlay.
 */
export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init.headers,
  };

  let res: Response;

  try {
    res = await fetchWithRetry(url, { ...init, headers });
  } catch (error) {
    const timedOut =
      error instanceof DOMException && error.name === "TimeoutError";

    throw new ApiError(
      NETWORK_ERROR_STATUS,
      timedOut
        ? "The Acceptify API took too long to respond. Please try again."
        : "Can't reach the Acceptify API. Check that the backend is running, then try again.",
      error,
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, extractDetail(body, res.statusText), body ?? undefined);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

/**
 * FastAPI's `detail` is a plain string for `HTTPException`, but a *list of
 * error objects* for request-validation failures (422). Interpolating that
 * list straight into a toast is where "[object Object]" came from, so unpack
 * it into something readable.
 */
function extractDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;

  const detail = (body as { detail?: unknown }).detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return null;

        const { msg, loc } = item as { msg?: unknown; loc?: unknown };
        if (typeof msg !== "string") return null;

        // loc looks like ["query", "university_id"] — the field name is the
        // part that tells you what actually went wrong.
        const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined;
        return field ? `${field}: ${msg}` : msg;
      })
      .filter((part): part is string => Boolean(part));

    if (parts.length > 0) return parts.join("; ");
  }

  if (detail && typeof detail === "object") {
    const msg = (detail as { msg?: unknown }).msg;
    if (typeof msg === "string") return msg;
  }

  return fallback;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
): Promise<Response> {
  // A caller-supplied signal wins: it usually means the component unmounted
  // or the user navigated away, and retrying that would be wrong.
  const hasCallerSignal = Boolean(init.signal);
  const attempts = hasCallerSignal ? 1 : 2;

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fetch(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });
    } catch (error) {
      lastError = error;

      // Only connection failures are worth repeating — a timeout means the
      // backend is reachable but wedged, and a second wait helps nobody.
      const isTimeout =
        error instanceof DOMException && error.name === "TimeoutError";
      if (isTimeout || attempt === attempts - 1) break;

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

/** True when the request never reached the backend (offline, down, timeout). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === NETWORK_ERROR_STATUS;
}
