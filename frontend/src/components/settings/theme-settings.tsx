"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Laptop, Moon, Sun } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Laptop },
] as const;

const copy = defineCopy({
  en: {
    title: "Appearance",
    description: "Choose how Acceptify AI looks on this device.",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  ru: {
    title: "Оформление",
    description: "Выбери, как Acceptify AI выглядит на этом устройстве.",
    light: "Светлая",
    dark: "Тёмная",
    system: "Как в системе",
  },
});

export function ThemeSettings() {
  const t = useCopy(copy);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {options.map((option) => {
            const isActive = mounted && theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2.5 rounded-xl border p-5 text-sm font-medium transition-all",
                  isActive
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {isActive ? (
                  <span className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-2.5" />
                  </span>
                ) : null}
                <option.icon className="size-5" />
                {t[option.value]}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
