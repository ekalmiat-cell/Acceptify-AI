"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Makes BRO's face swell and shrink with a voice, the way ChatGPT's voice
 * orb does: with his own voice while he speaks, with the student's while he
 * listens, and a slow breath while he thinks. The level is read every frame
 * and written straight to the transform, so it never re-renders React.
 */
export function VoicePulse({
  level,
  loud,
  grow,
  breathing = false,
  children,
}: {
  /** How loud the voice is right now (RMS, 0..1), or null when nothing should follow a voice. */
  level: (() => number) | null;
  /** The RMS that counts as full volume. */
  loud: number;
  /** How much bigger the face gets at full volume (0.1 = 10%). */
  grow: number;
  breathing?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion || (!level && !breathing)) {
      el.style.transform = "";
      return;
    }
    let frame = 0;
    let smooth = 0;
    const tick = (now: number) => {
      const target = level ? Math.min(1, level() / loud) : 0;
      // Up fast with each syllable, down slower, so it pulses rather than jitters.
      smooth += (target - smooth) * (target > smooth ? 0.5 : 0.15);
      const breath = breathing ? 0.025 * Math.sin(now / 450) : 0;
      el.style.transform = `scale(${(1 + smooth * grow + breath).toFixed(4)})`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [level, loud, grow, breathing, reduceMotion]);

  return (
    <div ref={ref} className="origin-center will-change-transform">
      {children}
    </div>
  );
}
