"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";

import type { SpokenWord } from "@/components/dashboard/copilot/use-ars-voice";
import { cn } from "@/lib/utils";

export type ArsMood = "idle" | "listening" | "thinking" | "speaking" | "sad";

/** Face ink. The face itself is white in both themes, so the ink is always navy. */
const INK = "#0b1f3a";

const blink: Transition = {
  duration: 4.2,
  times: [0, 0.9, 0.94, 0.98, 1],
  repeat: Infinity,
  ease: "easeInOut",
};

/**
 * The mentor's face: a rounded pill with two eyes and a mouth. The rim
 * follows the theme through `--ars-rim` (navy on light, brand blue on dark);
 * the face stays white with navy features. Moods: idle blinks, listening
 * leans in, thinking glances around, speaking opens the mouth once per
 * syllable of each spoken `word`, sad droops.
 */
export function ArsFace({
  mood = "idle",
  word,
  strict = false,
  className,
  title,
}: {
  mood?: ArsMood;
  word?: SpokenWord | null;
  /** The strict bro style: brows drawn down in a determined frown. */
  strict?: boolean;
  className?: string;
  title?: string;
}) {
  const reduceMotion = useReducedMotion();
  const still = reduceMotion ?? false;
  const sad = mood === "sad";

  const eyeAnimate = still
    ? { scaleY: sad ? 0.7 : 1 }
    : sad
      ? { scaleY: 0.7, y: 6 }
      : mood === "listening"
        ? { scaleY: [1.12, 1.12, 0.12, 1.12, 1.12], y: 0 }
        : { scaleY: [1, 1, 0.12, 1, 1], y: 0 };

  const lookAround = !still && mood === "thinking";

  return (
    <svg
      viewBox="0 0 200 112"
      role="img"
      aria-label={title}
      className={cn("block h-auto select-none overflow-visible", className)}
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="8"
        y="8"
        width="184"
        height="96"
        rx="48"
        fill="#ffffff"
        stroke="var(--ars-rim)"
        strokeWidth="11"
        className="transition-[stroke] duration-300"
      />

      <motion.g
        animate={lookAround ? { x: [0, -9, -9, 9, 9, 0], y: [0, -4, -4, -4, -4, 0] } : { x: 0, y: 0 }}
        transition={lookAround ? { duration: 2.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
      >
        {[74, 126].map((cx) => (
          <motion.ellipse
            key={cx}
            cx={cx}
            cy="50"
            rx="9.5"
            ry="14"
            fill={INK}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            animate={eyeAnimate}
            transition={sad || still ? { duration: 0.35 } : blink}
          />
        ))}

        {/* Sad brows: short lines slanting down to the outside. */}
        <motion.g
          initial={false}
          animate={{ opacity: sad ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          stroke={INK}
          strokeWidth="4.5"
          strokeLinecap="round"
        >
          <line x1="62" y1="38" x2="82" y2="32" />
          <line x1="118" y1="32" x2="138" y2="38" />
        </motion.g>

        {/* Strict brows: slanting down toward the middle. */}
        <motion.g
          initial={false}
          animate={{ opacity: strict && !sad ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          stroke={INK}
          strokeWidth="4.5"
          strokeLinecap="round"
        >
          <line x1="62" y1="29" x2="84" y2="35" />
          <line x1="116" y1="35" x2="138" y2="29" />
        </motion.g>
      </motion.g>

      <Mouth mood={mood} still={still} word={word ?? null} />
    </svg>
  );
}

/** Mouth openness per syllable: open wide, then nearly shut, a little uneven. */
function syllableFrames(syllables: number): number[] {
  const frames = [0.2];
  for (let i = 0; i < syllables; i++) frames.push(i % 2 === 0 ? 1 : 0.78, 0.25);
  frames[frames.length - 1] = 0.2;
  return frames;
}

function Mouth({ mood, still, word }: { mood: ArsMood; still: boolean; word: SpokenWord | null }) {
  if (mood === "sad") {
    return (
      <path d="M88 86 Q100 74 112 86" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
    );
  }

  if (mood === "speaking") {
    return (
      <motion.ellipse
        cx="100"
        cy="80"
        rx="10"
        ry="8"
        fill={INK}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
        // A new word restarts the mouth; between words it rests nearly shut.
        key={word?.id ?? "rest"}
        initial={{ scaleY: 0.2 }}
        animate={still || !word ? { scaleY: still ? 0.6 : 0.2 } : { scaleY: syllableFrames(word.syllables) }}
        transition={still || !word ? { duration: 0.12 } : { duration: word.ms / 1000, ease: "easeInOut" }}
      />
    );
  }

  if (mood === "thinking") {
    return <ellipse cx="100" cy="80" rx="6" ry="4.5" fill={INK} />;
  }

  // Idle and listening: a small filled smile.
  return <path d="M88 74 Q100 91 112 74 Z" fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth="2" />;
}
