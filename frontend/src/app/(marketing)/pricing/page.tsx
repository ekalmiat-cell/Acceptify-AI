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
    metaDescription: "Acceptify is free during beta. See what is available now and what is planned.",
    eyebrow: "Pricing",
    title: "Simple plans that scale with your application",
    description: "Acceptify is free while in beta. Paid plans with hands-on guidance are on the way.",
  },
  ru: {
    meta: "Тарифы",
    metaDescription: "Acceptify бесплатный, пока идёт бета. Смотри, что доступно сейчас и что в планах.",
    eyebrow: "Тарифы",
    title: "Простые тарифы, которые растут вместе с твоей заявкой",
    description: "Пока идёт бета, Acceptify бесплатный. Платные тарифы с личным сопровождением уже в работе.",
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
