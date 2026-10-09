"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/container";
import { DepartureBoard, type BoardFlight } from "@/components/marketing/departure-board";
import { HeroBackdrop } from "@/components/marketing/hero-backdrop";
import { UniversityLogo } from "@/components/shared/university-logo";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    badge: "Admission analysis for real applicants",
    before: "Know your",
    circled: "chances",
    line2: "Build your path.",
    lead: "Acceptify scores your profile against a specific university and programme, explains what drove the number, and turns the gaps into a plan you can act on before you apply.",
    cta: "Check my chances",
    explore: "Explore universities",
    note: "free while in beta!",
    counts: (universities: number, countries: number) => `${universities} universities · ${countries} countries`,
  },
  ru: {
    badge: "Анализ поступления для настоящих абитуриентов",
    before: "Узнай свои",
    circled: "шансы",
    line2: "Построй свой путь.",
    lead: "Acceptify сравнивает твой профиль с конкретным университетом и программой, объясняет, из чего сложилась оценка, и превращает пробелы в план, который можно выполнить до подачи.",
    cta: "Проверить шансы",
    explore: "Смотреть университеты",
    note: "бесплатно, пока бета!",
    counts: (universities: number, countries: number) => `${universities} университетов · ${countries} стран`,
  },
});

type MarqueeUniversity = Pick<
  University,
  "id" | "name" | "logoInitials" | "gradientFrom" | "gradientTo"
>;

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({
  universityCount,
  countryCount,
  marqueeUniversities,
  boardFlights,
}: {
  universityCount: number;
  countryCount: number;
  /** Catalog universities for the scrolling logo strip under the hero. */
  marqueeUniversities: MarqueeUniversity[];
  /** Catalog deadlines for the departures board. */
  boardFlights: BoardFlight[];
}) {
  const t = useCopy(copy);
  const reduceMotion = !!useReducedMotion();
  // With reduced motion everything is simply there — but `animate` must stay:
  // the server rendered the hidden starting state, and only it clears that.
  const rise = (delay: number) =>
    reduceMotion
      ? { initial: false as const, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    // At least one full screen tall, so the next section never peeks in
    // under the hero on a first load. `svh` keeps it steady on phones.
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-mk-bg pt-28 pb-10 sm:pt-32">
      <HeroBackdrop />

      <Container className="relative w-full max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="flex flex-col items-start gap-7">
            <motion.p
              {...rise(0.1)}
              className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.2em] text-mk-ink/55 uppercase"
            >
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#e5484d] opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-[#e5484d]" />
              </span>
              {t.badge}
            </motion.p>

            <h1 className="font-display text-[2.1rem] leading-[1.12] font-bold tracking-tight text-mk-ink sm:text-5xl lg:text-[2.9rem] xl:text-[3.4rem]">
              <motion.span {...rise(0.25)} className="block">
                {t.before} <Circled delay={reduceMotion ? 0 : 1.1}>{t.circled}</Circled>.
              </motion.span>
              <motion.span {...rise(0.45)} className="mt-1 block">
                <Highlighted delay={reduceMotion ? 0 : 1.8}>{t.line2}</Highlighted>
              </motion.span>
            </h1>

            <motion.p {...rise(0.7)} className="max-w-lg text-lg leading-relaxed text-mk-ink/60">
              {t.lead}
            </motion.p>

            <motion.div {...rise(0.9)} className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/sign-up"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full whitespace-nowrap bg-mk-ink px-7 text-[15px] font-semibold text-mk-bg transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {t.cta}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="#universities"
                className="inline-flex h-12 items-center justify-center rounded-full border whitespace-nowrap border-mk-ink/15 px-7 text-[15px] font-semibold text-mk-ink transition-colors hover:bg-mk-ink/5"
              >
                {t.explore}
              </Link>
              <MarginNote delay={reduceMotion ? 0 : 2.6}>{t.note}</MarginNote>
            </motion.div>

            {/* Only shown when the catalog actually loaded — "0 universities"
                because the API blinked is worse than saying nothing. */}
            {universityCount > 0 ? (
              <motion.p {...rise(1.1)} className="font-mono text-xs tracking-wide text-mk-ink/45">
                {t.counts(universityCount, countryCount)}
              </motion.p>
            ) : null}
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 30, rotate: 1.5 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: EASE }}
            className="relative mx-auto w-full max-w-md"
          >
            <DepartureBoard flights={boardFlights} />
          </motion.div>
        </div>
      </Container>

      {marqueeUniversities.length > 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="relative mt-16 w-full"
        >
          <UniversityMarquee universities={marqueeUniversities} />
        </motion.div>
      ) : null}
    </section>
  );
}

/** A word circled in blue marker, the loop drawn by hand once the line is in. */
function Circled({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[0.28em] -inset-y-[0.2em] h-[calc(100%+0.4em)] w-[calc(100%+0.56em)] overflow-visible"
      >
        <motion.path
          d="M30 16 C 80 2, 172 4, 191 34 C 206 62, 150 87, 90 84 C 30 81, 4 61, 12 39 C 18 22, 42 12, 74 10"
          fill="none"
          stroke="#2f6feb"
          strokeWidth="3.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={delay ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, delay, ease: [0.6, 0, 0.3, 1] }}
        />
      </svg>
    </span>
  );
}

/** Text with a yellow highlighter swiped behind it. */
function Highlighted({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.span
      className="box-decoration-clone bg-no-repeat px-1 [--hl:#ffe14d] dark:[--hl:rgba(255,215,64,0.32)]"
      style={{ backgroundImage: "linear-gradient(transparent 58%, var(--hl) 58%, var(--hl) 92%, transparent 92%)" }}
      initial={delay ? { backgroundSize: "0% 100%" } : false}
      animate={{ backgroundSize: "100% 100%" }}
      transition={{ duration: 0.7, delay, ease: [0.7, 0, 0.3, 1] }}
    >
      {children}
    </motion.span>
  );
}

/** A handwritten note with an arrow pointing back at the buttons. */
function MarginNote({ children, delay }: { children: ReactNode; delay: number }) {
  return (
    <motion.span
      initial={delay ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-1 font-hand text-2xl text-[#2f6feb] sm:ml-2 sm:-rotate-6"
    >
      <svg viewBox="0 0 40 24" className="hidden h-6 w-10 sm:block" aria-hidden="true">
        <path d="M38 14 C 28 22, 14 20, 4 8 M4 8 L 5 16 M4 8 L 12 9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {children}
    </motion.span>
  );
}

/** An endless strip of catalog universities, faded at both edges. */
function UniversityMarquee({ universities }: { universities: MarqueeUniversity[] }) {
  // Rendered twice so the loop is seamless; the copy is hidden from readers.
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-4 pr-4">
      {universities.map((university) => (
        <li
          key={university.id}
          className="flex items-center gap-2.5 rounded-full border border-mk-ink/10 bg-mk-surface py-1.5 pr-4 pl-1.5 whitespace-nowrap"
        >
          <UniversityLogo university={university} className="size-8 rounded-lg p-1 text-[0.55rem]" />
          <span className="text-sm font-semibold text-mk-ink/60">{university.name}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee-mask flex overflow-hidden py-3">
      <div className="marquee-track flex">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
