import type { Locale } from "@/lib/i18n/core";
import type { PricingTier } from "@/types/domain";

/**
 * Prices are in tenge. The paid tiers are on a launch discount: `oldPrice`
 * is the regular price, shown struck through. They are paid by a Kaspi
 * transfer (see components/pricing/kaspi-pay-dialog.tsx) and switched on by
 * hand.
 */
export const pricingTiers: Record<Locale, PricingTier[]> = {
  en: [
    {
      id: "free",
      name: "Free beta",
      price: 0,
      billingPeriod: "month",
      description: "Everything that exists today, free while Acceptify is in beta.",
      features: [
        "Unlimited admission analyses",
        "Safe / Target / Reach classification",
        "Catalog of 1,010 universities in 13 countries",
        "What-if simulator & PDF reports",
        "AI essay reviews (2 a day)",
        "Essay training with instant checks",
        "AI admissions copilot",
      ],
      cta: "Start for free",
      highlighted: false,
      available: true,
    },
    {
      id: "plus",
      name: "Plus",
      price: 990,
      oldPrice: 5000,
      billingPeriod: "month",
      description: "For students actively building and refining their list.",
      features: [
        "Everything in Free",
        "Scholarship match & coverage estimates",
        "Prediction trend charts",
        "Higher AI limits",
        "Priority email support",
      ],
      cta: "Buy with Kaspi",
      highlighted: true,
      available: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 1990,
      oldPrice: 10000,
      billingPeriod: "month",
      description: "Hands-on guidance for competitive, multi-country applications.",
      features: [
        "Everything in Plus",
        "1:1 application strategy sessions",
        "Human essay review credits",
        "Deadline & task management",
        "Dedicated success advisor",
      ],
      cta: "Buy with Kaspi",
      highlighted: false,
      available: true,
    },
  ],
  ru: [
    {
      id: "free",
      name: "Бесплатная бета",
      price: 0,
      billingPeriod: "month",
      description: "Всё, что есть сегодня, бесплатно, пока Acceptify в бете.",
      features: [
        "Анализ поступления без ограничений",
        "Категории: надёжный, целевой, амбициозный",
        "Каталог из 1010 университетов в 13 странах",
        "Симулятор «что если» и PDF-отчёты",
        "Разборы эссе с ИИ (2 в день)",
        "Тренировка эссе с мгновенной проверкой",
        "ИИ-помощник по поступлению",
      ],
      cta: "Начать бесплатно",
      highlighted: false,
      available: true,
    },
    {
      id: "plus",
      name: "Plus",
      price: 990,
      oldPrice: 5000,
      billingPeriod: "month",
      description: "Для тех, кто активно собирает и дорабатывает список.",
      features: [
        "Всё из бесплатного тарифа",
        "Подбор стипендий и оценка покрытия",
        "Графики динамики прогнозов",
        "Больше запросов к ИИ",
        "Приоритетная поддержка по почте",
      ],
      cta: "Оплатить через Kaspi",
      highlighted: true,
      available: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 1990,
      oldPrice: 10000,
      billingPeriod: "month",
      description: "Личное сопровождение для конкурсной подачи в несколько стран.",
      features: [
        "Всё из Plus",
        "Личные сессии по стратегии поступления",
        "Проверка эссе живым экспертом",
        "Дедлайны и задачи в одном месте",
        "Личный консультант",
      ],
      cta: "Оплатить через Kaspi",
      highlighted: false,
      available: true,
    },
  ],
};
