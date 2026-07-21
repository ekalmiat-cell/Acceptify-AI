"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

interface AnimatedCounterProps {
  value: string;
  suffix?: string;
  className?: string;
}

/**
 * Parses a display string like "24,000" or "$18M" into a numeric target,
 * animates a count-up when scrolled into view, then re-applies the original
 * formatting so odd values (currency, "M" suffixes) still render correctly.
 */
export function AnimatedCounter({ value, suffix, className }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(formatZero(value));

  const prefix = value.match(/^[^\d]*/)?.[0] ?? "";
  const numeric = Number(value.replace(/[^\d.]/g, "")) || 0;
  const trailing = value.match(/[^\d.,]*$/)?.[0] ?? "";

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, numeric, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(latest) {
        setDisplay(`${prefix}${Math.round(latest).toLocaleString("en-US")}${trailing}`);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
      {suffix}
    </motion.span>
  );
}

function formatZero(value: string) {
  const prefix = value.match(/^[^\d]*/)?.[0] ?? "";
  const trailing = value.match(/[^\d.,]*$/)?.[0] ?? "";
  return `${prefix}0${trailing}`;
}
