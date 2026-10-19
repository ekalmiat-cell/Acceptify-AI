import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "5 000 ₸" in Russian, "5,000 ₸" in English. */
export function formatTenge(amount: number, locale: "en" | "ru") {
  return `${new Intl.NumberFormat(locale === "ru" ? "ru-RU" : "en-US").format(amount)} ₸`
}
