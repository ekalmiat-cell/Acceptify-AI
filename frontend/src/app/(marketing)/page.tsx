import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { StatsSection } from "@/components/marketing/stats-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AiDemoSection } from "@/components/marketing/ai-demo-section";
import { UniversitiesSection } from "@/components/marketing/universities-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  description:
    "AI-powered university admission predictions. See your Safe, Target, and Reach schools in minutes.",
};

export default async function LandingPage() {
  const universities = await getUniversities();

  return (
    <>
      <Hero />
      <StatsSection />
      <FeaturesSection />
      <AiDemoSection universities={universities} />
      <UniversitiesSection universities={universities} />
      <TestimonialsSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
