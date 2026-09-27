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

// Rendered once and refreshed in the background every five minutes, like the
// catalog it shows — so the first page a visitor sees is served from the CDN.
export const revalidate = 300;

export default async function LandingPage() {
  const universities = await getUniversities();

  // The strip under the hero, as proof the catalog is real — taken from the
  // catalog itself (highest-ranked first, plus every Kazakh university for
  // the students we mostly serve), so it can never drift from what's there.
  const byRank = [...universities].sort((a, b) => a.worldRanking - b.worldRanking);
  const marqueeNames = Array.from(
    new Set([
      ...byRank.slice(0, 20).map((university) => university.name),
      ...byRank.filter((u) => u.country === "Kazakhstan").map((university) => university.name),
    ]),
  );

  const countryCount = new Set(universities.map((u) => u.country)).size;

  return (
    <>
      <Hero
        universityCount={universities.length}
        countryCount={countryCount}
        marqueeNames={marqueeNames}
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
