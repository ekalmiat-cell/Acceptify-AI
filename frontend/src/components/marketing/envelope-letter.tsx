"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The closing call to action as a letter sliding up out of an envelope,
 * then postmarked from Almaty. The bottom of the letter is blank paper that
 * stays tucked in the pocket, so nothing readable is ever covered.
 */
export function EnvelopeLetter({
  hello,
  title,
  text,
  cta,
  explore,
  signature,
  postmark,
}: {
  hello: string;
  title: string;
  text: string;
  cta: string;
  explore: string;
  signature: string;
  postmark: [string, string];
}) {
  const reduceMotion = !!useReducedMotion();

  return (
    // One trigger for the whole envelope, so the letter and the postmark
    // always play in order however the page is scrolled.
    <motion.div
      initial={reduceMotion ? "out" : "tucked"}
      whileInView="out"
      viewport={{ once: true, margin: "-60px" }}
      className="relative mx-auto max-w-2xl overflow-hidden pt-12"
    >
      {/* Inside of the envelope and its open flap, behind the letter. */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-44 rounded-t-md rounded-b-2xl bg-[#e2dac8] dark:bg-[#0f1d33]" />
      <svg
        aria-hidden="true"
        viewBox="0 0 100 30"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-44 h-24 w-full fill-[#e2dac8] dark:fill-[#0f1d33]"
      >
        <path d="M0 30 L 50 2 Q 50 0 52 1 L 100 30 Z" />
      </svg>

      <motion.div
        variants={{ tucked: { y: 170 }, out: { y: 0, transition: { duration: 1.1, delay: 0.2, ease: EASE } } }}
        className="relative z-10 mx-4 rounded-xl border border-mk-ink/10 bg-mk-surface px-6 pt-8 pb-48 shadow-[0_-10px_30px_-20px_rgba(11,31,58,0.35)] sm:mx-10 sm:px-10 sm:pt-10"
      >
        <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-mk-ink/40 uppercase">
          <span>Acceptify · ALA</span>
          <span>№ 2027</span>
        </div>
        <p className="mt-6 -rotate-2 font-hand text-3xl text-mk-accent">{hello}</p>
        <h2 className="mt-3 text-balance font-display text-2xl leading-tight font-bold text-mk-ink sm:text-3xl">{title}</h2>
        <p className="mt-4 max-w-md text-mk-ink/60">{text}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-mk-ink px-7 text-[15px] font-semibold whitespace-nowrap text-mk-bg transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {cta}
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="#universities"
            className="inline-flex h-12 items-center justify-center rounded-full border border-mk-ink/15 px-7 text-[15px] font-semibold whitespace-nowrap text-mk-ink transition-colors hover:bg-mk-ink/5"
          >
            {explore}
          </Link>
        </div>
        <p className="mt-6 text-right font-hand text-2xl text-mk-ink/70">{signature}</p>
      </motion.div>

      {/* The front pocket, with its folds. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 z-20 h-40 w-full"
      >
        <path d="M0 0 L 50 22 L 100 0 L 100 40 L 0 40 Z" className="fill-[#ece6d8] dark:fill-[#13233d]" />
        <path
          d="M0 40 L 44 19 M100 40 L 56 19"
          fill="none"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          className="stroke-mk-ink/15"
        />
      </svg>

      <motion.div
        aria-hidden="true"
        variants={{
          tucked: { opacity: 0, scale: 1.7, rotate: -30 },
          out: { opacity: 1, scale: 1, rotate: -14, transition: { type: "spring", stiffness: 380, damping: 16, delay: 1.3 } },
        }}
        className="absolute right-6 bottom-6 z-30 flex size-24 flex-col items-center justify-center rounded-full border-[3px] border-[#e5484d] font-mono text-[#e5484d] sm:right-12"
      >
        <span className="absolute inset-1.5 rounded-full border border-dashed border-[#e5484d]/60" />
        <span className="text-[10px] tracking-[0.2em]">{postmark[0]}</span>
        <span className="font-display text-xl font-bold">{postmark[1]}</span>
      </motion.div>
    </motion.div>
  );
}
