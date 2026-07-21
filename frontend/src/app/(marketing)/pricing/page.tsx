import type { Metadata } from "next";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { PricingCard } from "@/components/pricing/pricing-card";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { pricingTiers } from "@/data/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for every stage of your application journey.",
};

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden pt-40 pb-20 sm:pt-48">
        <div className="bg-grid-glow pointer-events-none absolute inset-0" />
        <Container className="relative max-w-7xl">
          <SectionHeading
            eyebrow="Pricing"
            title="Simple plans that scale with your application"
            description="Start free, upgrade when you're ready for unlimited predictions and hands-on guidance."
            dark
            className="mb-16"
          />

          <FadeInStagger className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pricingTiers.map((tier) => (
              <FadeInStaggerItem key={tier.id}>
                <PricingCard tier={tier} />
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
