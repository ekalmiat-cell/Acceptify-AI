import { ApiError, NETWORK_ERROR_STATUS } from "@/lib/api-error";
import { currentLocale } from "@/lib/i18n/browser";
import { defineCopy } from "@/lib/i18n/core";

const copy = defineCopy({
  en: {
    timedOut: "Acceptify took too long to respond. Please try again.",
    offline: "Can't reach Acceptify. Check your internet connection and try again.",
  },
  ru: {
    timedOut: "Acceptify слишком долго не отвечает. Попробуй ещё раз.",
    offline: "Не удаётся связаться с Acceptify. Проверь интернет и попробуй ещё раз.",
  },
});

const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * A flaky connection or a server restarting mid-deploy can drop a request
 * for a moment. One quiet retry turns that window into a slightly slower
 * request instead of a crashed screen.
 */
const RETRY_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The transport behind `apiFetch`.
 *
 * Pass your own `signal` for slow calls (the AI features): it replaces the
 * default timeout and turns off the retry, so a long request is never sent
 * twice.
 *
 * The important behaviour here is that an unreachable server surfaces
 * as an `ApiError` with status 0 and a sentence a person can act on, rather
 * than a bare `TypeError: Failed to fetch` blowing up in the error overlay.
 */
export async function requestJson<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
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
      timedOut ? copy[currentLocale()].timedOut : copy[currentLocale()].offline,
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
 * The API's `detail` is a plain string for most errors, but a *list of
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
  // Only reads are retried: a write whose response was lost may well have
  // been applied, and sending it again would save it twice.
  const method = (init.method ?? "GET").toUpperCase();
  const isRead = method === "GET" || method === "HEAD";
  const attempts = hasCallerSignal || !isRead ? 1 : 2;

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
      // server is reachable but wedged, and a second wait helps nobody.
      const isTimeout =
        error instanceof DOMException && error.name === "TimeoutError";
      if (isTimeout || attempt === attempts - 1) break;

      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

/** True when the request never reached the server (offline, down, timeout). */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === NETWORK_ERROR_STATUS;
}
