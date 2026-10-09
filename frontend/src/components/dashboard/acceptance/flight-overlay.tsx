"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { ALMATY, type LonLat } from "@/lib/geo";
import { WORLD_DOTS } from "@/lib/world-dots";

/**
 * The flight from Almaty to the university, played over the whole screen
 * when a student's fit score clears the bar: a dotted world map, a route
 * that draws itself, and a plane flying it in five seconds.
 */

const FLIGHT_MS = 5000;
/** How long the landed plane stays on screen before the overlay closes. */
const LANDED_MS = 1600;

const copy = defineCopy({
  en: {
    flight: "Flight",
    almaty: "Almaty",
    flying: (city: string) => `Flying to ${city}…`,
    landed: (name: string) => `Landed. Next stop: ${name}`,
    skip: "Skip",
  },
  ru: {
    flight: "Рейс",
    almaty: "Алматы",
    flying: (city: string) => `Летим в ${city}…`,
    landed: (name: string) => `Посадка. Следующая остановка — ${name}`,
    skip: "Пропустить",
  },
});

/** Map position in grid units: one unit per WORLD_DOTS.step degrees. */
function project([lon, lat]: LonLat): [number, number] {
  return [(lon + 180) / WORLD_DOTS.step, (WORLD_DOTS.latTop - lat) / WORLD_DOTS.step];
}

/** Every land dot, in grid units. */
const DOTS: [number, number][] = WORLD_DOTS.rows.flatMap((row, y) =>
  [...row].flatMap((hex, i) => {
    const nibble = parseInt(hex, 16);
    return [0, 1, 2, 3].flatMap((bit) => (nibble & (8 >> bit) ? [[i * 4 + bit + 0.5, y] as [number, number]] : []));
  }),
);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Point and heading (degrees) on the quadratic curve a→c→b at t. */
function along(a: number[], c: number[], b: number[], t: number) {
  const u = 1 - t;
  const x = u * u * a[0] + 2 * u * t * c[0] + t * t * b[0];
  const y = u * u * a[1] + 2 * u * t * c[1] + t * t * b[1];
  const dx = 2 * u * (c[0] - a[0]) + 2 * t * (b[0] - c[0]);
  const dy = 2 * u * (c[1] - a[1]) + 2 * t * (b[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

export function FlightOverlay({
  to,
  city,
  universityName,
  onDone,
}: {
  to: LonLat;
  city: string;
  universityName: string;
  onDone: () => void;
}) {
  const t = useCopy(copy);
  const [progress, setProgress] = useState(0);
  const landed = progress >= 1;
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // The map is framed to the screen: wide on a laptop, near-square on a
  // phone, so the route fills it either way.
  const [screen] = useState(() => {
    const width = Math.min(window.innerWidth - 32, 1024);
    return { width, aspect: Math.min(2.2, Math.max(0.9, width / (window.innerHeight * 0.55))) };
  });

  const geometry = useMemo(() => {
    const a = project(ALMATY);
    const b = project(to);
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const length = Math.hypot(dx, dy);
    // Bow the route northwards, like a great circle drawn on a flat map.
    let px = -dy / length;
    let py = dx / length;
    if (py > 0) {
      px = -px;
      py = -py;
    }
    const c = [mx + px * length * 0.28, my + py * length * 0.28];

    // Frame the whole route at the screen's aspect, with room for the labels.
    const xs = [a[0], b[0], c[0]];
    const ys = [a[1], b[1], c[1]];
    let x0 = Math.min(...xs) - 14;
    let x1 = Math.max(...xs) + 14;
    let y0 = Math.min(...ys) - 8;
    let y1 = Math.max(...ys) + 8;
    const { aspect } = screen;
    const width = Math.max(x1 - x0, 40, (y1 - y0) * aspect);
    const height = width / aspect;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    x0 = cx - width / 2;
    x1 = cx + width / 2;
    y0 = cy - height / 2;
    y1 = cy + height / 2;

    const dots = DOTS.filter(([x, y]) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 1 && y <= y1 + 1);
    return { a, b, c, dots, frame: { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } };
  }, [to, screen]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let closer = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const linear = reduce ? 1 : Math.min(1, (now - start) / FLIGHT_MS);
      setProgress(easeInOut(linear));
      if (linear < 1) frame = requestAnimationFrame(tick);
      else closer = window.setTimeout(() => doneRef.current(), LANDED_MS);
    };
    frame = requestAnimationFrame(tick);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && doneRef.current();
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(closer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const { a, b, c, dots, frame } = geometry;
  const route = `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
  const plane = along(a, c, b, Math.min(progress, 0.999));
  /** Ten screen pixels, in map units: labels and the plane keep their size on any screen. */
  const unit = (frame.width / screen.width) * 10;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${t.almaty} → ${city}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-6 bg-background px-4"
    >
      <button
        type="button"
        onClick={onDone}
        className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {t.skip}
        <X className="size-3.5" />
      </button>

      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        {t.flight} · {t.almaty} → {city}
      </p>

      <svg viewBox={`${frame.x} ${frame.y} ${frame.width} ${frame.height}`} className="w-full max-w-5xl" aria-hidden="true">
        <defs>
          {/* The route is dashed but must still draw itself: a solid stroke
              growing along it masks the dashes in. */}
          <mask id="flight-trail" maskUnits="userSpaceOnUse" {...frame}>
            <path
              d={route}
              pathLength={1}
              fill="none"
              stroke="white"
              strokeWidth={unit * 2}
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
            />
          </mask>
        </defs>

        <g className="fill-slate-300 dark:fill-slate-700">
          {dots.map(([x, y]) => (
            <circle key={`${x}:${y}`} cx={x} cy={y} r={0.3} />
          ))}
        </g>

        <path
          d={route}
          fill="none"
          mask="url(#flight-trail)"
          stroke="#2f6feb"
          strokeWidth={unit * 0.28}
          strokeDasharray={`${unit * 1.2} ${unit * 0.9}`}
          strokeLinecap="round"
        />

        <circle cx={a[0]} cy={a[1]} r={unit * 0.6} fill="#2f6feb" />
        <text
          x={a[0]}
          y={a[1] + unit * 2.8}
          textAnchor="middle"
          className="fill-foreground font-heading font-semibold"
          fontSize={unit * 1.8}
        >
          {t.almaty}
        </text>

        <motion.circle
          cx={b[0]}
          cy={b[1]}
          r={unit * 0.6}
          fill="#e5484d"
          initial={{ scale: 0 }}
          animate={{ scale: landed ? 1 : 0 }}
          style={{ transformOrigin: `${b[0]}px ${b[1]}px` }}
        />
        {landed && (
          <motion.circle
            cx={b[0]}
            cy={b[1]}
            r={unit * 0.6}
            fill="none"
            stroke="#e5484d"
            strokeWidth={unit * 0.25}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ transformOrigin: `${b[0]}px ${b[1]}px` }}
          />
        )}
        <text
          x={b[0]}
          y={b[1] + unit * 2.8}
          textAnchor="middle"
          className="fill-foreground font-heading font-semibold"
          fontSize={unit * 1.8}
          opacity={landed ? 1 : 0.35}
        >
          {city}
        </text>

        {!landed && (
          <g transform={`translate(${plane.x} ${plane.y}) rotate(${plane.angle}) scale(${unit * 0.38})`}>
            {/* A plane pointing along +x, centred on its middle. */}
            <path
              d="M5 0 C5 -0.6 4.2 -0.9 3.4 -0.9 L1.2 -0.9 L-1.6 -5 L-2.8 -5 L-1.4 -0.9 L-3.6 -0.9 L-4.6 -2.4 L-5.4 -2.4 L-4.8 0 L-5.4 2.4 L-4.6 2.4 L-3.6 0.9 L-1.4 0.9 L-2.8 5 L-1.6 5 L1.2 0.9 L3.4 0.9 C4.2 0.9 5 0.6 5 0 Z"
              className="fill-foreground"
            />
          </g>
        )}
      </svg>

      <div className="flex min-h-16 flex-col items-center gap-1 text-center">
        <p className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{city}</p>
        <p className="text-sm text-muted-foreground">{landed ? t.landed(universityName) : t.flying(city)}</p>
      </div>
    </motion.div>
  );
}
