import { GraduationCap, Landmark, Target, Wallet } from "lucide-react";

import { Container } from "@/components/shared/container";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { heroStats } from "@/data/stats";

const icons = [GraduationCap, Landmark, Target, Wallet];

export function StatsSection() {
  return (
    <section className="relative border-y border-white/10 bg-[#050e1c] py-16 sm:py-20">
      <Container className="max-w-7xl">
        <FadeIn className="mb-10 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-white/50">
            Trusted by students planning applications across 40+ countries
          </p>
        </FadeIn>

        <FadeInStagger className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {heroStats.map((stat, index) => {
            const Icon = icons[index % icons.length];
            return (
              <FadeInStaggerItem key={stat.id}>
                <div className="glass-panel flex h-full flex-col gap-4 rounded-2xl p-6">
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
