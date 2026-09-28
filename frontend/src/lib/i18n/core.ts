/**
 * The site's two interface languages. Russian is the default — most students
 * are in Kazakhstan — and English can be chosen in Settings. The choice lives
 * in a cookie, so the server renders the right language on the first paint.
 *
 * UI copy sits next to the component that shows it, both languages side by
 * side (`defineCopy`), so a new string can't be added in one language only.
 * Essay material — the texts students rewrite, model answers — stays in
 * English whatever the interface language, because the essays are English.
 *
 * Isomorphic and pure: safe to import from server and client code.
 */

export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "acceptify-locale";
/** A year: the choice is a preference, not a session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_NAMES: Record<Locale, string> = { ru: "Русский", en: "English" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Both languages of a piece of UI copy; the Russian must match the English shape. */
export function defineCopy<T>(copy: { en: T; ru: NoInfer<T> }): Record<Locale, T> {
  return copy;
}

const INTL_TAG: Record<Locale, string> = { ru: "ru-RU", en: "en-US" };

export function intlLocale(locale: Locale): string {
  return INTL_TAG[locale];
}

/**
 * Picks the right word form for a count. Russian needs three: 1 слово,
 * 2 слова, 5 слов — `{ one, few, many }`; English needs `{ one, other }`.
 */
export function plural(
  locale: Locale,
  n: number,
  forms: Partial<Record<Intl.LDMLPluralRule, string>> & { other?: string; many?: string },
): string {
  const rule = new Intl.PluralRules(INTL_TAG[locale]).select(n);
  return forms[rule] ?? forms.other ?? forms.many ?? "";
}

export function formatDate(
  locale: Locale,
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" },
): string {
  return new Date(value).toLocaleDateString(INTL_TAG[locale], options);
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(INTL_TAG[locale], options);
}
