"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/shared/container";
import { MatchBadge } from "@/components/shared/match-badge";

const trustedAt = ["MIT", "Stanford", "Oxford", "U of T", "NUS", "ETH Zurich"];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <div className="bg-grid-glow pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[140px]" />

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
              AI admission predictions, built for real applicants
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-balance font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl"
            >
              Know your admission chances{" "}
              <span className="text-gradient-brand">before you apply</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="max-w-lg text-balance text-lg leading-relaxed text-white/60"
            >
              Acceptify AI scores your profile against 500+ universities
              worldwide, sorts them into Safe, Target, and Reach, and shows
              you exactly what&apos;s missing to get in.
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
                Get your free prediction
                <ArrowRight />
              </Button>
              <Button
                render={<Link href="#ai-demo" />}
                size="lg"
                variant="outline"
                className="h-11 border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
              >
                See how it works
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs text-white/40"
            >
              <span className="font-medium text-white/60">
                Students accepted to:
              </span>
              {trustedAt.map((name) => (
                <span key={name} className="font-medium tracking-wide">
                  {name}
                </span>
              ))}
            </motion.div>

          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="glass-panel shadow-glow-brand relative rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                    MIT
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Massachusetts Institute of Technology
                    </p>
                    <p className="text-xs text-white/45">Cambridge, MA · Rank #1</p>
                  </div>
                </div>
                <MatchBadge category="reach" />
              </div>

              <div className="mt-5 flex items-end justify-between rounded-2xl bg-white/5 p-4">
                <div>
                  <p className="text-xs text-white/45">Your match score</p>
                  <p className="font-heading text-4xl font-semibold text-white">
                    38<span className="text-lg text-white/40">%</span>
                  </p>
                </div>
                <TrendingUp className="size-8 text-brand" />
              </div>

              <ul className="mt-5 flex flex-col gap-2.5">
                {[
                  "GPA exceeds median admit",
                  "SAT score 60 pts below median",
                  "2 competitive achievements logged",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-center gap-2 text-sm text-white/70"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-brand" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-panel absolute -bottom-8 -left-10 hidden w-56 rounded-2xl p-4 sm:block">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>University of Toronto</span>
                <MatchBadge category="target" />
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-white">71%</p>
            </div>

            <div className="glass-panel absolute -top-8 -right-6 hidden w-52 rounded-2xl p-4 sm:block">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Nazarbayev Univ.</span>
                <MatchBadge category="safe" />
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-white">87%</p>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
