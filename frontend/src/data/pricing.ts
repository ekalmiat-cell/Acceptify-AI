import type { PricingTier } from "@/types/domain";

export const pricingTiers: PricingTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    billingPeriod: "month",
    description: "Get your first predictions and explore the platform.",
    features: [
      "3 AI predictions per month",
      "Safe / Target / Reach classification",
      "Access to 12+ university profiles",
      "Basic profile & achievements tracker",
      "Community support",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 14,
    billingPeriod: "month",
    description: "For students actively building and refining their list.",
    features: [
      "Unlimited AI predictions",
      "Full requirements gap analysis",
      "Scholarship match & coverage estimates",
      "Prediction history & trend charts",
      "Personalized recommendations engine",
      "Priority email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 29,
    billingPeriod: "month",
    description: "Full guidance for competitive, multi-country applications.",
    features: [
      "Everything in Pro",
      "1:1 application strategy sessions",
      "Essay & profile review credits",
      "Early access to new university data",
      "Deadline & task management",
      "Dedicated success advisor",
    ],
    cta: "Go Ultimate",
    highlighted: false,
  },
];
