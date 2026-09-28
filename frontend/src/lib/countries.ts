import type { Locale } from "@/lib/i18n/core";

/**
 * Country names in the interface language. The catalog stores English names
 * (they are also search keys and the AI's context); these are for display.
 */
const RU: Record<string, string> = {
  "United States": "США",
  "United Kingdom": "Великобритания",
  "South Korea": "Южная Корея",
  Kazakhstan: "Казахстан",
  Japan: "Япония",
  Italy: "Италия",
  Germany: "Германия",
  China: "Китай",
  Singapore: "Сингапур",
  Switzerland: "Швейцария",
  Canada: "Канада",
  Australia: "Австралия",
  France: "Франция",
  Netherlands: "Нидерланды",
  "Hong Kong": "Гонконг",
  Russia: "Россия",
  Turkey: "Турция",
  "Czech Republic": "Чехия",
  Hungary: "Венгрия",
  Poland: "Польша",
  Spain: "Испания",
  Sweden: "Швеция",
  Finland: "Финляндия",
  Austria: "Австрия",
  Ireland: "Ирландия",
  "United Arab Emirates": "ОАЭ",
  Malaysia: "Малайзия",
};

export function countryName(country: string, locale: Locale): string {
  return locale === "ru" ? (RU[country] ?? country) : country;
}
