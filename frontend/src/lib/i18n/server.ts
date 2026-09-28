import "server-only";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, toLocale, type Locale } from "@/lib/i18n/core";

/** The visitor's interface language, from their cookie (Russian by default). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return toLocale(store.get(LOCALE_COOKIE)?.value);
}
