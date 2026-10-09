import type { Metadata } from "next";

import { Hero } from "@/components/marketing/hero";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AiDemoSection } from "@/components/marketing/ai-demo-section";
import { UniversitiesSection } from "@/components/marketing/universities-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { FaqSection } from "@/components/marketing/faq-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import logoIds from "@/data/university-logos.json";
import { getUniversities } from "@/lib/universities-server";

import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const universitiesWithLogo = new Set<string>(logoIds);

const copy = defineCopy({
  en: {
    description:
      "Know your chances. Build your path. Acceptify estimates your admission chance for a specific university and programme, explains the score, and turns the gaps into an action plan.",
  },
  ru: {
    description:
      "Узнай свои шансы. Построй свой путь. Acceptify оценивает шансы на поступление в конкретный университет и программу, объясняет оценку и превращает пробелы в план действий.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  return { description: copy[await getLocale()].description };
}

// Rendered once and refreshed in the background every five minutes, like the
// catalog it shows — so the first page a visitor sees is served from the CDN.
export const revalidate = 300;

export default async function LandingPage() {
  const universities = await getUniversities();

  // The strip under the hero, as proof the catalog is real — taken from the
  // catalog itself (highest-ranked first, plus every Kazakh university for
  // the students we mostly serve), so it can never drift from what's there.
  // Only those with a real logo, so the strip reads as a wall of logos.
  const byRank = [...universities]
    .filter((university) => universitiesWithLogo.has(university.id))
    .sort((a, b) => a.worldRanking - b.worldRanking);
  const marqueeUniversities = Array.from(
    new Map(
      [...byRank.slice(0, 24), ...byRank.filter((u) => u.country === "Kazakhstan")].map(
        ({ id, name, logoInitials, gradientFrom, gradientTo }) => [
          id,
          { id, name, logoInitials, gradientFrom, gradientTo },
        ],
      ),
    ).values(),
  );

  const countryCount = new Set(universities.map((u) => u.country)).size;

  return (
    <>
      <Hero
        universityCount={universities.length}
        countryCount={countryCount}
        marqueeUniversities={marqueeUniversities}
        boardFlights={universities.map((u) => ({
          name: u.shortName || u.name,
          city: u.city,
          country: u.country,
          deadline: u.applicationDeadline,
        }))}
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
