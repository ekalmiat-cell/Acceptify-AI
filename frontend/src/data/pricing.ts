import type { PricingTier } from "@/types/domain";

/**
 * Acceptify is free while in beta: every feature below "Free beta" is real
 * and unlocked for everyone. The paid tiers are what is planned — they are
 * shown so students know where the product is going, marked unavailable, and
 * nothing can be bought yet.
 */
export const pricingTiers: PricingTier[] = [
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
];
