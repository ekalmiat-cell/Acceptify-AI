import type { Locale } from "@/lib/i18n/core";

/**
 * The public site's navigation labels in the interface language, keyed by
 * the English label kept in config/site.ts.
 */
const RU: Record<string, string> = {
  "How it works": "Как это работает",
  "What you get": "Что ты получишь",
  "Live demo": "Демо",
  Universities: "Университеты",
  Pricing: "Тарифы",
  FAQ: "Вопросы",
  Telegram: "Telegram",
  Email: "Почта",
  "Privacy Policy": "Политика конфиденциальности",
  "Terms of Use": "Условия использования",
};

export function navLabel(label: string, locale: Locale): string {
  return locale === "ru" ? (RU[label] ?? label) : label;
}
