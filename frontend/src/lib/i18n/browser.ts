import { LOCALE_COOKIE, toLocale, type Locale } from "@/lib/i18n/core";

/**
 * The interface language outside React — e.g. for the network error messages
 * built in the fetch helpers. Reads the same cookie the server does; on the
 * server (no document) it falls back to the default.
 */
export function currentLocale(): Locale {
  if (typeof document === "undefined") return toLocale(null);
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return toLocale(match?.[1]);
}
