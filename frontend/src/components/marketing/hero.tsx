"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { HeroAnalysisCard } from "@/components/marketing/hero-analysis-card";
import { HeroBackdrop } from "@/components/marketing/hero-backdrop";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero({
  universityCount,
  countryCount,
  marqueeNames,
}: {
  universityCount: number;
  countryCount: number;
  /** Catalog university names for the scrolling strip under the hero. */
  marqueeNames: string[];
}) {
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
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
            >
              <Sparkles className="size-3.5 text-brand" />
              Admission analysis for real applicants
            </motion.span>

            <h1 className="text-balance font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
              <RevealWords text="Know your chances." delay={0.1} instant={!!reduceMotion} />{" "}
              {/* The gradient goes on each word: background-clip:text on a
                  parent does not reach children animated on their own layer. */}
              <RevealWords
                text="Build your path."
                delay={0.45}
                instant={!!reduceMotion}
                className="text-gradient-brand"
              />
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.8, ease: EASE }}
              className="max-w-lg text-balance text-lg leading-relaxed text-white/60"
            >
              Acceptify scores your profile against a specific university and
              programme, explains what drove the number, and turns the gaps
              into a plan you can act on before you apply.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95, ease: EASE }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="btn-shine group h-11 bg-gradient-brand px-6 text-white shadow-glow-brand hover:opacity-95"
              >
                Check My Chances
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
              <Button
                render={<Link href="#universities" />}
                size="lg"
                variant="outline"
                className="h-11 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                Explore Universities
              </Button>
            </motion.div>

            {/* Only shown when the catalog actually loaded — a hero that
                announces "0 universities across 0 countries" because the API
                blinked is worse than one that says nothing. */}
            {universityCount > 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                className="text-xs font-medium text-white/50"
              >
                {universityCount} universities across {countryCount} countries — free while in beta
              </motion.p>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
            className="relative mx-auto w-full max-w-md"
          >
            <HeroAnalysisCard />
          </motion.div>
        </div>
      </Container>

      {marqueeNames.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="relative mt-16 w-full"
        >
          <UniversityMarquee names={marqueeNames} />
        </motion.div>
      ) : null}
    </section>
  );
}

/** Words rise and un-blur one after another. */
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
            initial={instant ? false : { y: "100%", opacity: 0, filter: "blur(8px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: delay + i * 0.09, ease: EASE }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </span>
      ))}
    </>
  );
}

/** An endless strip of catalog names, faded at both edges. */
function UniversityMarquee({ names }: { names: string[] }) {
  // Rendered twice so the loop is seamless; the copy is hidden from readers.
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-10 pr-10">
      {names.map((name) => (
        <li key={name} className="whitespace-nowrap text-sm font-medium text-white/35">
          {name}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="marquee-mask flex overflow-hidden border-y border-white/5 py-4">
      <div className="marquee-track flex">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
