import { Landmark, Globe2, SlidersHorizontal, GraduationCap } from "lucide-react";

import { Container } from "@/components/shared/container";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { buildPlatformStats } from "@/data/stats";
import type { University } from "@/types/domain";

const icons = [Landmark, Globe2, SlidersHorizontal, GraduationCap];

export function StatsSection({ universities }: { universities: University[] }) {
  // Two of these four figures are counted off the catalog. If it failed to
  // load there is nothing truthful to put in them, and a wall of zeroes under
  // the heading "what the platform actually holds" would be worse than an
  // absent section.
  if (universities.length === 0) return null;

  const stats = buildPlatformStats(universities);

  return (
    <section className="relative border-y border-white/10 bg-[#050e1c] py-16 sm:py-20">
      <Container className="max-w-7xl">
        <FadeIn className="mb-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-white/50">
            What the platform actually holds today
          </p>
        </FadeIn>

        <FadeInStagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = icons[index % icons.length];
            return (
              <FadeInStaggerItem key={stat.id}>
                <div className="glass-panel flex h-full flex-col gap-4 rounded-xl p-6">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="font-heading text-3xl font-semibold text-white">
                      <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-1 text-sm text-white/45">{stat.label}</p>
                  </div>
                </div>
              </FadeInStaggerItem>
            );
          })}
        </FadeInStagger>
      </Container>
    </section>
  );
}
