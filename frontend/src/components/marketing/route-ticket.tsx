"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Plane } from "lucide-react";

import { cn } from "@/lib/utils";

export interface RouteStop {
  code: string;
  title: string;
  description: string;
  note: string;
}

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * "How it works" as one boarding pass: three stops along a dashed route,
 * a plane flying it once the ticket scrolls in, perforations between the
 * stops like tear-off coupons.
 */
export function RouteTicket({
  header,
  flight,
  stops,
}: {
  header: string;
  flight: string;
  stops: RouteStop[];
}) {
  const reduceMotion = !!useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 28, rotate: -0.6 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative overflow-hidden rounded-3xl border border-mk-ink/10 bg-mk-surface shadow-[0_30px_60px_-40px_rgba(11,31,58,0.45)]"
    >
      {/* Side notches where the header coupon tears off. */}
      <span className="absolute top-[2.35rem] -left-2.5 size-5 rounded-full border border-mk-ink/10 bg-mk-bg" aria-hidden="true" />
      <span className="absolute top-[2.35rem] -right-2.5 size-5 rounded-full border border-mk-ink/10 bg-mk-bg" aria-hidden="true" />
      <div className="flex items-center justify-between border-b border-dashed border-mk-ink/15 gap-4 px-6 py-4 font-mono text-[10px] tracking-[0.12em] text-mk-ink/50 uppercase sm:px-8 sm:text-[11px] sm:tracking-[0.2em]">
        <span className="truncate">{header}</span>
        <span className="whitespace-nowrap text-mk-ink/80">{flight}</span>
      </div>

      {/* The route: a dashed line drawn left to right, a plane riding it. */}
      <div className="relative hidden h-16 px-8 md:block" aria-hidden="true">
        <svg className="absolute inset-x-[16%] top-1/2 h-6 w-[68%] -translate-y-1/2 overflow-visible" viewBox="0 0 100 10" preserveAspectRatio="none">
          <motion.path
            d="M0 8 C 30 -2, 70 -2, 100 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeDasharray="1 5"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="text-mk-ink/35"
            initial={reduceMotion ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, delay: 0.5, ease: "easeInOut" }}
          />
        </svg>
        <motion.span
          className="absolute top-1/2 left-[16%] -mt-3 -ml-3 flex size-6 items-center justify-center text-mk-accent"
          initial={reduceMotion ? { left: "84%" } : { left: "16%", opacity: 0 }}
          whileInView={{ left: "84%", opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, delay: 0.5, ease: "easeInOut" }}
        >
          <Plane className="size-5 rotate-45" />
        </motion.span>
        {stops.map((stop, i) => (
          <span
            key={stop.code}
            className="absolute top-1/2 -mt-1.5 size-3 -translate-x-1/2 rounded-full border-2 border-mk-ink bg-mk-surface"
            style={{ left: `${16 + i * 34}%` }}
          />
        ))}
      </div>

      <ol className="grid md:grid-cols-3">
        {stops.map((stop, i) => (
          <li
            key={stop.code}
            className={cn(
              "relative flex flex-col gap-3 px-6 pt-6 pb-8 sm:px-8 md:pt-2",
              i > 0 && "border-t border-dashed border-mk-ink/15 md:border-t-0 md:border-l",
            )}
          >
            {/* Notches where the coupon tears off. */}
            {i > 0 ? (
              <span className="absolute -bottom-2.5 -left-2.5 hidden size-5 rounded-full border border-mk-ink/10 bg-mk-bg md:block" />
            ) : null}
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-display text-5xl font-bold tracking-tight text-mk-ink">{stop.code}</span>
              <motion.span
                initial={reduceMotion ? false : { opacity: 0, rotate: -12, scale: 0.85 }}
                whileInView={{ opacity: 1, rotate: -4, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.2 + i * 0.5 }}
                className="font-hand text-xl leading-none text-mk-accent"
              >
                {stop.note}
              </motion.span>
            </div>
            <h3 className="font-display text-lg font-semibold text-mk-ink">{stop.title}</h3>
            <p className="text-sm leading-relaxed text-mk-ink/60">{stop.description}</p>
          </li>
        ))}
      </ol>
    </motion.div>
  );
}
