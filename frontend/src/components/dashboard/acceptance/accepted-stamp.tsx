"use client";

import { motion, useReducedMotion } from "framer-motion";

import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

const copy = defineCopy({
  en: { accepted: "Accepted", replay: "Watch the flight again" },
  ru: { accepted: "Принят", replay: "Посмотреть полёт ещё раз" },
});

/**
 * A red rubber stamp across a high fit score. `slam` plays it coming down
 * hard (the first time a result earns it); otherwise it is simply there.
 * Tapping it replays the flight.
 */
export function AcceptedStamp({
  slam,
  onClick,
  className,
}: {
  slam: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const t = useCopy(copy);
  const reduceMotion = useReducedMotion();
  const animated = slam && !reduceMotion;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      title={t.replay}
      aria-label={`${t.accepted}. ${t.replay}`}
      initial={animated ? { scale: 2.6, rotate: -28, opacity: 0 } : false}
      animate={{ scale: 1, rotate: -12, opacity: 0.92 }}
      transition={animated ? { type: "spring", stiffness: 520, damping: 18, mass: 0.9 } : { duration: 0 }}
      whileHover={{ scale: 1.04 }}
      className={cn(
        "cursor-pointer select-none rounded-xl border-[3px] border-[#e5484d] px-4 py-1.5",
        "font-heading text-2xl font-extrabold uppercase tracking-[0.12em] text-[#e5484d]",
        "mix-blend-multiply dark:mix-blend-normal",
        className,
      )}
    >
      {t.accepted}
    </motion.button>
  );
}
