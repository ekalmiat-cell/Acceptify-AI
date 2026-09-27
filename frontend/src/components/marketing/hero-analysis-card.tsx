"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Sparkles } from "lucide-react";

import { MatchBadge } from "@/components/shared/match-badge";
import { UniversityLogo } from "@/components/shared/university-logo";
import type { MatchCategory } from "@/types/domain";

/**
 * Illustrations of the analysis screen, not real users' results — the card is
 * labelled "Example analysis" so the numbers can't be mistaken for platform
 * statistics. The live version is the demo section further down the page.
 */
const EXAMPLES: {
  /** Catalog id, for the logo. */
  id: string;
  initials: string;
  university: string;
  programme: string;
  score: number;
  category: MatchCategory;
  rows: { label: string; score: number }[];
  action: string;
}[] = [
  {
    id: "uni-nu",
    initials: "NU",
    university: "Nazarbayev University",
    programme: "Engineering",
    score: 82,
    category: "safe",
    rows: [
      { label: "Academic strength", score: 88 },
      { label: "Activities", score: 74 },
      { label: "Leadership", score: 69 },
      { label: "Achievements", score: 81 },
    ],
    action: "Next best action: you are a strong fit — spend the time on scholarship essays.",
  },
  {
    id: "uni-toronto",
    initials: "UofT",
    university: "University of Toronto",
    programme: "Computer Science",
    score: 64,
    category: "target",
    rows: [
      { label: "Academic strength", score: 78 },
      { label: "Activities", score: 66 },
      { label: "Leadership", score: 41 },
      { label: "Achievements", score: 70 },
    ],
    action: "Next best action: strengthen leadership — the weakest part of this profile.",
  },
  {
    id: "uni-university-of-edinburgh",
    initials: "UoE",
    university: "University of Edinburgh",
    programme: "Economics",
    score: 37,
    category: "reach",
    rows: [
      { label: "Academic strength", score: 58 },
      { label: "Activities", score: 44 },
      { label: "Leadership", score: 35 },
      { label: "Achievements", score: 29 },
    ],
    action: "Next best action: raise IELTS to 7.0 — it moves this score the most.",
  },
];

/** How long each example stays on screen once it has finished "analysing". */
const HOLD_MS = 5200;
const SCAN_MS = 1100;

export function HeroAnalysisCard() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(1);
  const [phase, setPhase] = useState<"scanning" | "result">("scanning");
  const example = EXAMPLES[index];

  // Scan → result → next example, forever. Reduced motion shows one static
  // result and stops.
  useEffect(() => {
    if (reduceMotion) {
      setPhase("result");
      return;
    }
    if (phase === "scanning") {
      const t = setTimeout(() => setPhase("result"), SCAN_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % EXAMPLES.length);
      setPhase("scanning");
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [phase, reduceMotion]);

  // Gentle 3D tilt toward the pointer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 18 });

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onPointerLeave() {
    px.set(0);
    py.set(0);
  }

  const showResult = phase === "result";

  return (
    <div style={{ perspective: 1200 }} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="glass-panel shadow-glow-brand relative overflow-hidden rounded-2xl p-6 backdrop-blur-md"
      >
        {/* Scan line sweeping the card while it "analyses". */}
        <AnimatePresence>
          {!showResult ? (
            <motion.div
              key={`scan-${index}`}
              initial={{ top: "-20%", opacity: 0 }}
              animate={{ top: "110%", opacity: [0, 1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: SCAN_MS / 1000, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-[#4a8bff]/25 to-transparent"
            />
          ) : null}
        </AnimatePresence>

        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-white/50 uppercase">
            Example analysis
          </span>
          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.span
                key={`badge-${index}`}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.5 }}
              >
                <MatchBadge category={example.category} />
              </motion.span>
            ) : (
              <motion.span
                key={`analysing-${index}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-xs text-white/50"
              >
                <Sparkles className="size-3.5 animate-pulse text-[#4a8bff]" />
                Analysing profile…
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Fixed height, so the card does not jump while names swap. */}
        <div className="mt-5 h-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2.5"
            >
              <UniversityLogo
                university={{
                  id: example.id,
                  name: example.university,
                  logoInitials: example.initials,
                  gradientFrom: "#1d4fd8",
                  gradientTo: "#2f6feb",
                }}
                className="size-9 text-[0.6rem]"
              />
              <div>
                <p className="text-sm font-medium text-white">{example.university}</p>
                <p className="text-xs text-white/45">{example.programme}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-5 rounded-xl bg-white/5 p-4">
          <p className="text-xs text-white/45">Programme fit score</p>
          <p className="font-heading text-4xl font-semibold text-white tabular-nums">
            <CountUp key={`${index}-${phase}`} to={showResult ? example.score : 0} instant={!!reduceMotion} />
            <span className="text-lg text-white/40">/100</span>
          </p>
        </div>

        <ul className="mt-5 flex flex-col gap-3">
          {example.rows.map((row, i) => (
            <li key={row.label} className="flex items-center gap-3 text-sm">
              <span className="w-32 shrink-0 text-white/60">{row.label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.span
                  className="block h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ width: showResult ? `${row.score}%` : "0%" }}
                  transition={
                    showResult
                      ? { duration: 0.8, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }
                      : { duration: 0.3 }
                  }
                />
              </span>
              <span className="w-8 shrink-0 text-right font-mono text-xs text-white/70 tabular-nums">
                {showResult ? row.score : "—"}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 min-h-[3.25rem] border-t border-white/10 pt-4">
          <AnimatePresence mode="wait">
            {showResult ? (
              <motion.p
                key={`action-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.9 }}
                className="text-xs leading-relaxed text-white/55"
              >
                {example.action}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Which example is showing. */}
        <div className="mt-4 flex justify-center gap-1.5">
          {EXAMPLES.map((e, i) => (
            <span
              key={e.university}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === index ? "w-6 bg-[#4a8bff]" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/** Counts from 0 to `to` with an ease-out, like a score being computed. */
function CountUp({ to, instant }: { to: number; instant: boolean }) {
  const [value, setValue] = useState(instant ? to : 0);

  useEffect(() => {
    if (instant || to === 0) {
      setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.1,
      delay: 0.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, instant]);

  return <>{value}</>;
}
