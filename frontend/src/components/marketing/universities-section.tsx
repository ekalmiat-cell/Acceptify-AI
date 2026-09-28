import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    eyebrow: "University database",
    title: "Every university, with the numbers that decide",
    description:
      "Rankings, acceptance rates, tuition, and entry requirements come from the catalog itself — where a value is missing, it says so rather than guessing.",
    unavailable: "The university catalog is temporarily unavailable",
    unavailableNote: "Nothing is shown here rather than placeholder universities. Try again in a moment.",
    rank: "World rank",
    acceptance: "Acceptance",
  },
  ru: {
    eyebrow: "База университетов",
    title: "Каждый университет — с цифрами, которые решают",
    description:
      "Рейтинги, доля принятых, стоимость обучения и требования берутся прямо из каталога — если значения нет, так и написано, без догадок.",
    unavailable: "Каталог университетов временно недоступен",
    unavailableNote: "Лучше ничего не показывать, чем выдуманные университеты. Попробуй чуть позже.",
    rank: "Мировой рейтинг",
    acceptance: "Принимают",
  },
});

export async function UniversitiesSection({ universities }: { universities: University[] }) {
  const locale = await getLocale();
  const t = copy[locale];
  const featured = [...universities].sort((a, b) => a.worldRanking - b.worldRanking).slice(0, 8);

  return (
    <section id="universities" className="relative scroll-mt-16 bg-[#071326] py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-16"
          dark
        />

        {featured.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 py-16 text-center">
            <p className="text-sm font-semibold text-white">{t.unavailable}</p>
            <p className="max-w-sm text-sm text-white/55">{t.unavailableNote}</p>
          </div>
        ) : (
          <FadeInStagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.1}>
            {featured.map((university) => (
              <FadeInStaggerItem key={university.id} className="h-full">
                <Link
                  href="/sign-in"
                  className="hover-lift glass-panel group flex h-full flex-col gap-4 rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between">
                    <UniversityLogo
                      university={university}
                      className="size-12 rounded-xl text-xs transition-transform duration-300 group-hover:scale-110"
                    />
                    <ArrowUpRight className="size-4 text-white/30 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#4a8bff]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-white">
                      {university.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-white/50">
                      <MapPin className="size-3" />
                      {university.city}, {countryName(university.country, locale)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                    <div>
                      <p className="text-white/40">{t.rank}</p>
                      <p className="font-semibold text-white">#{university.worldRanking}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40">{t.acceptance}</p>
                      <p className="font-semibold text-white">{university.acceptanceRate}%</p>
                    </div>
                  </div>
                </Link>
              </FadeInStaggerItem>
            ))}
          </FadeInStagger>
        )}
      </Container>
    </section>
  );
}
