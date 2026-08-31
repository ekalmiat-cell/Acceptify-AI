"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { MatchBadge } from "@/components/shared/match-badge";

export function Hero({
  universityCount,
  countryCount,
  featuredNames,
}: {
  universityCount: number;
  countryCount: number;
  featuredNames: string[];
}) {
  return (
    <section className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <div className="bg-grid-glow pointer-events-none absolute inset-0" />

      <Container className="relative max-w-7xl">
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

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-balance font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              Know your chances.{" "}
              <span className="text-gradient-brand">Build your path.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-lg text-balance text-lg leading-relaxed text-white/60"
            >
              Acceptify scores your profile against a specific university and
              programme, explains what drove the number, and turns the gaps
              into a plan you can act on before you apply.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="h-11 bg-gradient-brand px-6 text-white shadow-glow-brand hover:opacity-90"
              >
                Check My Chances
                <ArrowRight />
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-white/40"
              >
                <span className="font-medium text-white/60">
                  {universityCount} universities across {countryCount} countries:
                </span>
                {featuredNames.map((name) => (
                  <span key={name} className="font-medium tracking-wide">
                    {name}
                  </span>
                ))}
              </motion.div>
            ) : null}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            {/*
              An illustration of the analysis screen, not a real user's
              result — labelled as such so the numbers can't be mistaken for
              platform statistics. The genuinely live version is the demo
              section further down the page.
            */}
            <div className="glass-panel shadow-glow-brand relative rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-white/50 uppercase">
                  Example analysis
                </span>
                <MatchBadge category="target" />
              </div>

              <div className="mt-5 flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white">
                  U of T
                </span>
                <div>
                  <p className="text-sm font-medium text-white">
                    University of Toronto
                  </p>
                  <p className="text-xs text-white/45">Computer Science</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-white/5 p-4">
                <p className="text-xs text-white/45">Programme fit score</p>
                <p className="font-heading text-4xl font-semibold text-white">
                  64<span className="text-lg text-white/40">/100</span>
                </p>
              </div>

              <ul className="mt-5 flex flex-col gap-3">
                {[
                  { label: "Academic strength", score: 78 },
                  { label: "Activities", score: 66 },
                  { label: "Leadership", score: 41 },
                  { label: "Achievements", score: 70 },
                ].map((row) => (
                  <li key={row.label} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 text-white/60">{row.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${row.score}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right font-mono text-xs text-white/70">
                      {row.score}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">
                Next best action: strengthen leadership — it is the weakest
                part of this profile relative to the programme.
              </p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
