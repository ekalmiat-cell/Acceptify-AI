import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import type { University } from "@/types/domain";

export function UniversitiesSection({ universities }: { universities: University[] }) {
  const featured = [...universities].sort((a, b) => a.worldRanking - b.worldRanking).slice(0, 8);

  return (
    <section id="universities" className="relative bg-white py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="University database"
          title="Every university, with the numbers that decide"
          description="Rankings, acceptance rates, tuition, and entry requirements come from the catalog itself — where a value is missing, it says so rather than guessing."
          className="mb-16"
        />

        {featured.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#0b1f3a]/15 py-16 text-center">
            <p className="text-sm font-medium text-[#0b1f3a]">
              The university catalog is temporarily unavailable
            </p>
            <p className="max-w-sm text-sm text-[#4b5468]">
              Nothing is shown here rather than placeholder universities. Try
              again in a moment.
            </p>
          </div>
        ) : (
        <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((university) => (
            <FadeInStaggerItem key={university.id}>
              <Link
                href="/sign-in"
                className="group flex h-full flex-col gap-4 rounded-xl border border-[#0b1f3a]/10 bg-[#f7f8fa] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0b1f3a]/15 hover:shadow-lg hover:shadow-[#0b1f3a]/5"
              >
                <div className="flex items-start justify-between">
                  <span
                    className="flex size-11 items-center justify-center rounded-xl text-xs font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
                    }}
                  >
                    {university.logoInitials}
                  </span>
                  <ArrowUpRight className="size-4 text-[#0b1f3a]/30 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0b1f3a]/60" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-semibold text-[#0b1f3a]">
                    {university.name}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-[#4b5468]">
                    <MapPin className="size-3" />
                    {university.city}, {university.country}
                  </p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-[#0b1f3a]/10 pt-4 text-xs">
                  <div>
                    <p className="text-[#8590a6]">World rank</p>
                    <p className="font-medium text-[#0b1f3a]">#{university.worldRanking}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#8590a6]">Acceptance</p>
                    <p className="font-medium text-[#0b1f3a]">{university.acceptanceRate}%</p>
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
