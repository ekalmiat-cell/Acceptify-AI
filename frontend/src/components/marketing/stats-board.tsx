"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";

import { Flap } from "@/components/marketing/departure-board";
import type { StatItem } from "@/types/domain";

/**
 * The platform's numbers on a split-flap board, the same one the hero's
 * departures hang on. Each digit sits on its own tile and flips into place
 * when the board scrolls in.
 */
export function StatsBoard({ title, stats }: { title: string; stats: StatItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl bg-[#0c0c0e] p-5 text-white shadow-[0_30px_60px_-30px_rgba(11,31,58,0.55)] ring-1 ring-black/5 sm:p-7 dark:ring-white/10"
    >
      <div className="mb-6 flex items-center justify-between gap-4 font-mono text-[11px] tracking-[0.2em] text-white/50 uppercase">
        <span>{title}</span>
        <span className="size-1.5 animate-pulse rounded-full bg-[#3dd68c]" aria-hidden="true" />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
        {stats.map((stat, s) => (
          <div key={stat.id} className="flex flex-col gap-3 lg:px-6 lg:first:pl-0">
            <dt className="order-2 font-mono text-[11px] leading-relaxed tracking-[0.12em] text-white/50 uppercase">
              {stat.label}
            </dt>
            <dd className="order-1 flex gap-1" aria-label={stat.value + (stat.suffix ?? "")}>
              {[...(stat.value + (stat.suffix ?? ""))].map((char, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="relative flex h-14 w-10 items-center justify-center rounded-md bg-white/[0.07] font-mono text-3xl font-semibold text-[#ffd84d] sm:h-16 sm:w-11 sm:text-4xl"
                >
                  {/* The hinge across the middle of each tile. */}
                  <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
                  {inView ? <Flap value={char} width={1} delay={s * 220 + i * 90} /> : char}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
