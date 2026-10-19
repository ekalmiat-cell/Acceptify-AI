import type { Metadata } from "next";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { PricingCard } from "@/components/pricing/pricing-card";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { pricingTiers } from "@/data/pricing";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    meta: "Pricing",
    metaDescription: "Start free. Plus and Pro are on a launch discount, paid in tenge with Kaspi.",
    eyebrow: "Pricing",
    title: "Simple plans that scale with your application",
    description: "Start free. Plus and Pro are on a launch discount — pay in tenge with a Kaspi transfer.",
  },
  ru: {
    meta: "Тарифы",
    metaDescription: "Начни бесплатно. Plus и Pro со скидкой на старте, оплата в тенге через Kaspi.",
    eyebrow: "Тарифы",
    title: "Простые тарифы, которые растут вместе с твоей заявкой",
    description: "Начни бесплатно. Plus и Pro — со скидкой на старте, оплата в тенге переводом на Kaspi.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const t = copy[await getLocale()];
  return { title: t.meta, description: t.metaDescription };
}

export default async function PricingPage() {
  const locale = await getLocale();
  const t = copy[locale];
  return (
    <>
      <section className="relative overflow-hidden pt-40 pb-20 sm:pt-48">
        <div className="bg-grid-glow pointer-events-none absolute inset-0" />
        <Container className="relative max-w-7xl">
          <SectionHeading
            eyebrow={t.eyebrow}
            title={t.title}
            description={t.description}
            dark
            className="mb-16"
          />

          <FadeInStagger className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pricingTiers[locale].map((tier) => (
              <FadeInStaggerItem key={tier.id}>
                <PricingCard tier={tier} locale={locale} />
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        </Container>
      </section>

      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
