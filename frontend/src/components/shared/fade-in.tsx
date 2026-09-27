"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}

// Unhurried on purpose: a reveal should be noticed, then read.
const variants: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/**
 * Scroll-triggered reveal used throughout marketing + dashboard sections.
 * Keeps entrance choreography (timing, easing) in one place.
 */
export function FadeIn({
  children,
  className,
  delay = 0.1,
  y = 28,
  once = true,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={{
        hidden: { opacity: 0, y, filter: "blur(6px)" },
        visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({
  children,
  className,
  staggerDelay = 0.15,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={variants} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
      {children}
    </motion.div>
  );
}
