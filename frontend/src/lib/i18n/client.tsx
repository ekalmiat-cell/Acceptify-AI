"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/lib/i18n/core";

const LocaleContext = createContext<Locale | null>(null);

/** Hands the server-chosen language to every client component below it. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  const locale = useContext(LocaleContext);
  if (!locale) throw new Error("useLocale must be used inside <LocaleProvider>");
  return locale;
}

/** This component's copy in the current language. */
export function useCopy<T>(copy: Record<Locale, T>): T {
  return copy[useLocale()];
}

/** Switches the interface language: stores the choice and re-renders the page. */
export function useSetLocale(): (locale: Locale) => void {
  const router = useRouter();
  return useCallback(
    (locale: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      document.documentElement.lang = locale;
      router.refresh();
    },
    [router],
  );
}
