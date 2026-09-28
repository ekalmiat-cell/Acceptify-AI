import type { Locale } from "@/lib/i18n/core";
import type { PricingTier } from "@/types/domain";

/**
 * Acceptify is free while in beta: every feature below "Free beta" is real
 * and unlocked for everyone. The paid tiers are what is planned — they are
 * shown so students know where the product is going, marked unavailable, and
 * nothing can be bought yet.
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
        "Catalog of 239 universities in 12 countries",
        "What-if simulator & PDF reports",
        "AI essay reviews (3 a day)",
        "Essay training with instant checks",
        "AI admissions copilot",
      ],
      cta: "Start for free",
      highlighted: true,
      available: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 14,
      billingPeriod: "month",
      description: "Planned: for students actively building and refining their list.",
      features: [
        "Everything in Free",
        "Scholarship match & coverage estimates",
        "Prediction trend charts",
        "Higher AI limits",
        "Priority email support",
      ],
      cta: "Coming soon",
      highlighted: false,
      available: false,
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: 29,
      billingPeriod: "month",
      description: "Planned: hands-on guidance for competitive, multi-country applications.",
      features: [
        "Everything in Pro",
        "1:1 application strategy sessions",
        "Human essay review credits",
        "Deadline & task management",
        "Dedicated success advisor",
      ],
      cta: "Coming soon",
      highlighted: false,
      available: false,
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
        "Каталог из 239 университетов в 12 странах",
        "Симулятор «что если» и PDF-отчёты",
        "Разборы эссе с ИИ (3 в день)",
        "Тренировка эссе с мгновенной проверкой",
        "ИИ-помощник по поступлению",
      ],
      cta: "Начать бесплатно",
      highlighted: true,
      available: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 14,
      billingPeriod: "month",
      description: "В планах: для тех, кто активно собирает и дорабатывает список.",
      features: [
        "Всё из бесплатного тарифа",
        "Подбор стипендий и оценка покрытия",
        "Графики динамики прогнозов",
        "Больше запросов к ИИ",
        "Приоритетная поддержка по почте",
      ],
      cta: "Скоро",
      highlighted: false,
      available: false,
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: 29,
      billingPeriod: "month",
      description: "В планах: личное сопровождение для конкурсной подачи в несколько стран.",
      features: [
        "Всё из Pro",
        "Личные сессии по стратегии поступления",
        "Проверка эссе живым экспертом",
        "Дедлайны и задачи в одном месте",
        "Личный консультант",
      ],
      cta: "Скоро",
      highlighted: false,
      available: false,
    },
  ],
};
