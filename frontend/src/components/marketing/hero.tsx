"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { HeroAnalysisCard } from "@/components/marketing/hero-analysis-card";
import { HeroBackdrop } from "@/components/marketing/hero-backdrop";
import { UniversityLogo } from "@/components/shared/university-logo";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    badge: "Admission analysis for real applicants",
    line1: "Know your chances.",
    line2: "Build your path.",
    lead: "Acceptify scores your profile against a specific university and programme, explains what drove the number, and turns the gaps into a plan you can act on before you apply.",
    cta: "Check my chances",
    explore: "Explore universities",
    counts: (universities: number, countries: number) =>
      `${universities} universities across ${countries} countries — free while in beta`,
  },
  ru: {
    badge: "Анализ поступления для настоящих абитуриентов",
    line1: "Узнай свои шансы.",
    line2: "Построй свой путь.",
    lead: "Acceptify сравнивает твой профиль с конкретным университетом и программой, объясняет, из чего сложилась оценка, и превращает пробелы в план, который можно выполнить до подачи.",
    cta: "Проверить шансы",
    explore: "Смотреть университеты",
    counts: (universities: number, countries: number) =>
      `${universities} университетов в ${countries} странах — бесплатно, пока идёт бета`,
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
}: {
  universityCount: number;
  countryCount: number;
  /** Catalog universities for the scrolling logo strip under the hero. */
  marqueeUniversities: MarqueeUniversity[];
}) {
  const t = useCopy(copy);
  const reduceMotion = useReducedMotion();

  return (
    // At least one full screen tall, so the next (white) section never peeks
    // in under the hero on a first load. `svh` keeps it steady on phones,
    // where the browser's address bar grows and shrinks.
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden pt-32 pb-10 sm:pt-36">
      <HeroBackdrop />

      <Container className="relative w-full max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col items-start gap-7">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-mk-ink/10 bg-mk-ink/5 px-4 py-1.5 text-xs font-medium text-mk-ink/70"
            >
              <Sparkles className="size-3.5 text-brand" />
              {t.badge}
            </motion.span>

            <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight text-mk-ink sm:text-5xl md:text-6xl">
              <RevealWords text={t.line1} delay={0.5} instant={!!reduceMotion} />{" "}
              {/* The gradient goes on each word: background-clip:text on a
                  parent does not reach children animated on their own layer. */}
              <RevealWords
                text={t.line2}
                delay={1.1}
                instant={!!reduceMotion}
                className="text-gradient-brand"
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.8, ease: EASE }}
              className="max-w-lg text-balance text-lg leading-relaxed text-mk-ink/60"
            >
              {t.lead}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 2.2, ease: EASE }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="btn-shine group h-11 bg-gradient-brand px-6 text-white shadow-glow-brand hover:opacity-95"
              >
                {t.cta}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                render={<Link href="#universities" />}
                size="lg"
                variant="outline"
                className="h-11 border-mk-ink/15 bg-mk-ink/5 px-6 text-mk-ink hover:bg-mk-ink/10"
              >
                {t.explore}
              </Button>
            </motion.div>

            {/* Only shown when the catalog actually loaded — a hero that
                announces "0 universities across 0 countries" because the API
                blinked is worse than one that says nothing. */}
            {universityCount > 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 2.6 }}
                className="text-xs font-medium text-mk-ink/50"
              >
                {t.counts(universityCount, countryCount)}
              </motion.p>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.9, ease: EASE }}
            className="relative mx-auto w-full max-w-md"
          >
            <HeroAnalysisCard />
          </motion.div>
        </div>
      </Container>

      {marqueeUniversities.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.8 }}
          className="relative mt-16 w-full"
        >
          <UniversityMarquee universities={marqueeUniversities} />
        </motion.div>
      ) : null}
    </section>
  );
}

/** Words rise into place one after another. */
function RevealWords({
  text,
  delay,
  instant,
  className,
}: {
  text: string;
  delay: number;
  instant: boolean;
  className?: string;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span
            className={`inline-block ${className ?? ""}`}
            initial={instant ? false : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: delay + i * 0.16, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
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
          className="nav-pill flex items-center gap-2.5 rounded-full bg-mk-ink/[0.03] py-1.5 pr-4 pl-1.5 whitespace-nowrap"
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
