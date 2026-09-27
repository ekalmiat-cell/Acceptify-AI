"use client";

import { useEffect, useRef } from "react";

/**
 * The hero's living background: the existing grid, three slow drifting
 * glows in the brand blues (one hue, low contrast — not a rainbow), and a
 * soft spotlight that follows the pointer on devices that have one.
 *
 * Everything moves with CSS transforms only, so it stays on the compositor
 * and costs next to nothing; `prefers-reduced-motion` freezes it (see
 * globals.css).
 */
export function HeroBackdrop() {
  const spotlight = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotlight.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;

    let frame = 0;
    function onMove(event: PointerEvent) {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Relative to the hero, which scrolls with the page.
        const box = el!.parentElement!.getBoundingClientRect();
        el!.style.transform = `translate3d(${event.clientX - box.left}px, ${event.clientY - box.top}px, 0)`;
        el!.style.opacity = "1";
      });
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-grid-glow absolute inset-0" />
      <div className="hero-glow hero-glow-a" />
      <div className="hero-glow hero-glow-b" />
      <div className="hero-glow hero-glow-c" />
      <div ref={spotlight} className="hero-spotlight" />
      {/* Fades the glows out before the next section starts. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#071326]" />
    </div>
  );
}
