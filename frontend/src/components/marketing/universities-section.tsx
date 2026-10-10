import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { cityName } from "@/lib/geo";
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
    pass: "Boarding pass",
    from: "Almaty",
    university: "University",
    more: (count: number) => `and ${count} more in the catalog`,
    all: "Open the full catalog",
  },
  ru: {
    eyebrow: "База университетов",
    title: "Каждый университет — с цифрами, которые решают",
    description:
      "Рейтинги, доля принятых, стоимость обучения и требования берутся прямо из каталога — если значения нет, так и написано, без догадок.",
    unavailable: "Каталог университетов временно недоступен",
    unavailableNote: "Лучше ничего не показывать, чем выдуманные университеты. Попробуй чуть позже.",
    rank: "Рейтинг",
    acceptance: "Принимают",
    pass: "Посадочный талон",
    from: "Алматы",
    university: "Вуз",
    more: (count: number) => `и ещё ${count} в каталоге`,
    all: "Открыть весь каталог",
  },
});

/** "Cambridge, MA" → "CAM": a three-letter code for the pass, like an airport's. */
function cityCode(city: string): string {
  const latin = cityName(city).normalize("NFD").replace(/[^A-Za-z]/g, "");
  return (latin || city).slice(0, 3).toUpperCase();
}

/** Bar widths for a fake barcode, the same for a university every time. */
function barcode(id: string): number[] {
  let seed = [...id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return Array.from({ length: 22 }, () => {
    seed = (seed * 1103515245 + 12345) >>> 0;
    return 1 + (seed % 3);
  });
}

export async function UniversitiesSection({ universities }: { universities: University[] }) {
  const locale = await getLocale();
  const t = copy[locale];
  const featured = [...universities].sort((a, b) => a.worldRanking - b.worldRanking).slice(0, 8);
  const rest = universities.length - featured.length;

  return (
    <section id="universities" className="relative scroll-mt-16 border-y border-mk-ink/5 bg-mk-deep py-24 sm:py-32">
      <Container className="max-w-6xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-16"
          dark
        />

        {featured.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-mk-ink/15 py-16 text-center">
            <p className="text-sm font-semibold text-mk-ink">{t.unavailable}</p>
            <p className="max-w-sm text-sm text-mk-ink/55">{t.unavailableNote}</p>
          </div>
        ) : (
          <>
            <FadeInStagger className="grid grid-cols-1 gap-5 lg:grid-cols-2" staggerDelay={0.08}>
              {featured.map((university, index) => (
                <FadeInStaggerItem key={university.id} className="h-full">
                  <Link
                    href="/sign-in"
                    className="group relative flex h-full overflow-hidden rounded-2xl border border-mk-ink/10 bg-mk-surface transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-mk-ink/25 hover:shadow-[0_18px_34px_-22px_rgba(11,31,58,0.55)]"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 sm:p-6">
                      <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mk-ink/45 uppercase">
                        <span>{t.pass}</span>
                        <span>AC {String(101 + index * 7).padStart(4, "0")}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-display text-3xl font-bold tracking-tight text-mk-ink">ALA</p>
                          <p className="text-xs text-mk-ink/50">{t.from}</p>
                        </div>
                        <div className="flex flex-1 items-center">
                          <span className="flex-1 border-t-2 border-dotted border-mk-ink/25" />
                          <Plane className="mx-1.5 size-4 shrink-0 rotate-45 text-mk-accent transition-transform duration-500 group-hover:translate-x-2" />
                          <span className="flex-1 border-t-2 border-dotted border-mk-ink/25" />
                        </div>
                        <div className="min-w-0 text-right">
                          <p className="font-display text-3xl font-bold tracking-tight text-mk-ink">{cityCode(university.city)}</p>
                          <p className="truncate text-xs text-mk-ink/50">
                            {cityName(university.city)}, {countryName(university.country, locale)}
                          </p>
                        </div>
                      </div>

                      <dl className="mt-auto grid grid-cols-[1fr_auto_auto] gap-x-5 border-t border-mk-ink/10 pt-4">
                        <div className="min-w-0">
                          <dt className="font-mono text-[10px] tracking-[0.15em] text-mk-ink/40 uppercase">{t.university}</dt>
                          <dd className="truncate text-sm font-semibold text-mk-ink">{university.name}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] tracking-[0.15em] text-mk-ink/40 uppercase">{t.rank}</dt>
                          <dd className="font-mono text-sm font-semibold text-mk-ink">#{university.worldRanking}</dd>
                        </div>
                        <div>
                          <dt className="font-mono text-[10px] tracking-[0.15em] text-mk-ink/40 uppercase">{t.acceptance}</dt>
                          <dd className="font-mono text-sm font-semibold text-[#e5484d]">{university.acceptanceRate}%</dd>
                        </div>
                      </dl>
                    </div>

                    {/* The tear-off stub: perforation, logo and a barcode. */}
                    <div className="relative hidden w-24 shrink-0 flex-col items-center justify-between border-l-2 border-dashed border-mk-ink/15 py-5 sm:flex">
                      <span className="absolute -top-2.5 -left-2.5 size-5 rounded-full border border-mk-ink/10 bg-mk-deep" />
                      <span className="absolute -bottom-2.5 -left-2.5 size-5 rounded-full border border-mk-ink/10 bg-mk-deep" />
                      <UniversityLogo
                        university={university}
                        className="size-11 rounded-xl text-xs transition-transform duration-300 group-hover:-rotate-6"
                      />
                      <span className="flex h-12 items-stretch gap-[2px]" aria-hidden="true">
                        {barcode(university.id).map((width, i) => (
                          <span key={i} className="bg-mk-ink/80" style={{ width }} />
                        ))}
                      </span>
                    </div>
                  </Link>
                </FadeInStaggerItem>
              ))}
            </FadeInStagger>

            {rest > 0 ? (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="-rotate-2 font-hand text-2xl text-mk-accent">{t.more(rest)}</p>
                <Link
                  href="/sign-up"
                  className="group inline-flex h-11 items-center gap-2 rounded-full border border-mk-ink/15 px-6 text-sm font-semibold text-mk-ink transition-colors hover:bg-mk-ink/5"
                >
                  {t.all}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : null}
          </>
        )}
      </Container>
    </section>
  );
}
