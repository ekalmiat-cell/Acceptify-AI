"use client";

import { Check, Languages } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LOCALES, LOCALE_NAMES, defineCopy } from "@/lib/i18n/core";
import { useCopy, useLocale, useSetLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const copy = defineCopy({
  en: {
    title: "Language",
    description: "The language of the interface and of AI feedback. Essays and drill texts stay in English.",
  },
  ru: {
    title: "Язык",
    description: "Язык интерфейса и отзывов ИИ. Эссе и тексты упражнений остаются на английском.",
  },
});

export function LanguageSettings() {
  const t = useCopy(copy);
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="size-4" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          {LOCALES.map((code) => {
            const isActive = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                aria-pressed={isActive}
                className={cn(
                  "relative rounded-xl border p-4 text-sm font-medium transition-all",
                  isActive ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-muted",
                )}
              >
                {isActive ? (
                  <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" />
                  </span>
                ) : null}
                {LOCALE_NAMES[code]}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
