"use client";

import { motion, useReducedMotion } from "framer-motion";

import { ALMATY, type LonLat } from "@/lib/geo";
import { WORLD_DOTS } from "@/lib/world-dots";

/**
 * The hero's background: plain white with a faint dotted world map, and a
 * few dashed routes out of Almaty drawing themselves on load — the same map
 * the flight animation flies over once a student's result is in.
 */

/** Map position in dot-grid units (one per WORLD_DOTS.step degrees). */
function project([lon, lat]: LonLat): [number, number] {
  return [(lon + 180) / WORLD_DOTS.step, (WORLD_DOTS.latTop - lat) / WORLD_DOTS.step];
}

/** All land as one path of zero-length segments: round caps draw each as a dot, in a single node. */
const LAND = WORLD_DOTS.rows
  .flatMap((row, y) =>
    [...row].flatMap((hex, i) => {
      const nibble = parseInt(hex, 16);
      return [0, 1, 2, 3].flatMap((bit) => (nibble & (8 >> bit) ? [`M${i * 4 + bit + 0.5} ${y}h0`] : []));
    }),
  )
  .join("");

const WIDTH = WORLD_DOTS.cols;
const HEIGHT = WORLD_DOTS.rows.length;

/** Boston, London, Seoul, Singapore: where the routes go. */
const DESTINATIONS: LonLat[] = [
  [-71.1, 42.4],
  [-0.13, 51.5],
  [127, 37.5],
  [103.8, 1.35],
];

function route(to: LonLat): string {
  const [ax, ay] = project(ALMATY);
  const [bx, by] = project(to);
  const length = Math.hypot(bx - ax, by - ay);
  // Bow each route northwards, like a great circle on a flat map.
  const cx = (ax + bx) / 2;
  const cy = Math.min(ay, by) - length * 0.22;
  return `M${ax} ${ay}Q${cx} ${cy} ${bx} ${by}`;
}

export function HeroBackdrop() {
  const reduceMotion = useReducedMotion();
  const [ax, ay] = project(ALMATY);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        // On a phone the map would be cropped to a few giant dots behind the text.
        className="absolute inset-0 hidden h-full w-full opacity-70 sm:block"
      >
        <path d={LAND} stroke="currentColor" strokeWidth={0.62} strokeLinecap="round" className="text-mk-ink/[0.09]" />

        {DESTINATIONS.map((to, i) => {
          const [bx, by] = project(to);
          return (
            <g key={i}>
              {/* Dashed, yet drawing itself: a growing solid stroke masks the dashes in. */}
              <mask id={`hero-route-${i}`} maskUnits="userSpaceOnUse" x={0} y={0} width={WIDTH} height={HEIGHT}>
                <motion.path
                  d={route(to)}
                  fill="none"
                  stroke="white"
                  strokeWidth={1.2}
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.6, delay: 1.2 + i * 0.35, ease: [0.6, 0, 0.3, 1] }}
                />
              </mask>
              <path
                d={route(to)}
                mask={`url(#hero-route-${i})`}
                fill="none"
                stroke="#2f6feb"
                strokeWidth={0.22}
                strokeDasharray="0.9 0.7"
                strokeLinecap="round"
                className="opacity-40"
              />
              <motion.circle
                cx={bx}
                cy={by}
                r={0.55}
                fill="#2f6feb"
                className="opacity-50"
                initial={reduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 2.8 + i * 0.35, type: "spring", stiffness: 400, damping: 14 }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            </g>
          );
        })}
        <circle cx={ax} cy={ay} r={0.7} fill="#2f6feb" className="opacity-70" />
      </svg>

      {/* Hands the page over to the next section without a seam. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-mk-bg" />
    </div>
  );
}
