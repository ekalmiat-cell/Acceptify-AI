"use client";

import { LOCALES } from "@/lib/i18n/core";
import { useLocale, useSetLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** A compact RU / EN toggle for pages without Settings (the public site). */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div className={cn("flex rounded-full border border-mk-ink/15 p-0.5 text-xs font-semibold", className)}>
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          lang={code}
          aria-label={code === "ru" ? "Русский" : "English"}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            locale === code ? "bg-mk-ink/10 text-mk-ink" : "text-mk-ink/55 hover:text-mk-ink",
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
