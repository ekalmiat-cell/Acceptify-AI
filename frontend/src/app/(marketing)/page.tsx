import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AiDemoSection } from "@/components/marketing/ai-demo-section";
import { UniversitiesSection } from "@/components/marketing/universities-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  description:
    "Know your chances. Build your path. Acceptify estimates your admission chance for a specific university and programme, explains the score, and turns the gaps into an action plan.",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const universities = await getUniversities();

  // Named in the hero as proof the catalog is real — taken from the catalog
  // itself, highest-ranked first, so it can never drift from what's there.
  const featuredNames = [...universities]
    .sort((a, b) => a.worldRanking - b.worldRanking)
    .slice(0, 6)
    .map((university) => university.shortName);

  const countryCount = new Set(universities.map((u) => u.country)).size;

  return (
    <>
      <Hero
        universityCount={universities.length}
        countryCount={countryCount}
        featuredNames={featuredNames}
      />
      <HowItWorksSection />
      <FeaturesSection />
      <AiDemoSection universities={universities} />
      <UniversitiesSection universities={universities} />
      <StatsSection universities={universities} />
      <FaqSection />
      <FinalCtaSection />
    </>
  );
}
