import { Container } from "@/components/shared/container";
import { FadeIn } from "@/components/shared/fade-in";
import { StatsBoard } from "@/components/marketing/stats-board";
import { buildPlatformStats } from "@/data/stats";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: { heading: "What the platform actually holds today" },
  ru: { heading: "Что на платформе есть уже сегодня" },
});

export async function StatsSection({ universities }: { universities: University[] }) {
  const locale = await getLocale();
  // Two of these four figures are counted off the catalog. If it failed to
  // load there is nothing truthful to put in them, and a wall of zeroes under
  // the heading "what the platform actually holds" would be worse than an
  // absent section.
  if (universities.length === 0) return null;

  const stats = buildPlatformStats(universities, locale);

  return (
    <section className="relative bg-mk-bg py-16 sm:py-24">
      <Container className="max-w-6xl">
        <FadeIn>
          <StatsBoard title={copy[locale].heading} stats={stats} />
        </FadeIn>
      </Container>
    </section>
  );
}
