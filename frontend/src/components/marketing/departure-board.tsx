"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { ArsFace } from "@/components/dashboard/copilot/ars-face";
import { cityName } from "@/lib/geo";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/**
 * The hero's departures board: the catalog's nearest application deadlines,
 * shown like flights out of Almaty, a page at a time with the letters
 * flipping over. Real dates, not made-up chances. The mentor peeks over the
 * top edge and follows the pointer with his eyes.
 */

export interface BoardFlight {
  name: string;
  city: string;
  country: string;
  /** As stored in the catalog, e.g. "Jan 1, 2027". */
  deadline: string;
}

const ROWS = 5;

const sameCountry = (a: BoardFlight, b: BoardFlight) => a.country === b.country;
const PAGE_MS = 6000;
const DAY_MS = 24 * 60 * 60 * 1000;

const copy = defineCopy({
  en: {
    departures: "Departures",
    from: "Almaty",
    date: "Deadline",
    city: "City",
    uni: "University",
    status: "Status",
    lastCall: "LAST CALL",
    boarding: "BOARDING",
    onTime: "ON TIME",
    months: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    note: "Application deadlines, nearest first",
  },
  ru: {
    departures: "Вылеты",
    from: "Алматы",
    date: "Дедлайн",
    city: "Город",
    uni: "Вуз",
    status: "Статус",
    lastCall: "ПОСЛ. ВЫЗОВ",
    boarding: "ПОСАДКА",
    onTime: "ПО ПЛАНУ",
    months: ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"],
    note: "Дедлайны подачи заявлений, ближайшие сверху",
  },
});

type Status = "lastCall" | "boarding" | "onTime";

const STATUS_COLOR: Record<Status, string> = {
  lastCall: "text-[#ff6b5e]",
  boarding: "text-[#ffc53d]",
  onTime: "text-[#3dd68c]",
};

interface Row {
  date: string;
  city: string;
  uni: string;
  status: Status;
}

const LATIN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CYRILLIC = "АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ";
const DIGITS = "0123456789";

/** A random character of the same kind, for the flip. */
function noise(char: string): string {
  const set = /\d/.test(char) ? DIGITS : /[А-ЯЁ]/.test(char) ? CYRILLIC : /[A-Z]/.test(char) ? LATIN : null;
  return set ? set[Math.floor(Math.random() * set.length)] : char;
}

/** Text that flips through random letters before settling, like a split-flap board. */
export function Flap({ value, width, delay, className }: { value: string; width: number; delay: number; className?: string }) {
  const target = value.toUpperCase().slice(0, width).padEnd(width, " ");
  const [shown, setShown] = useState(target);
  const reduceMotion = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    if (reduceMotion) return setShown(target);
    let step = 0;
    const steps = first.current ? 14 : 9;
    first.current = false;
    let interval = 0;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        step += 1;
        // Characters settle left to right as the flip runs out.
        const settled = Math.floor((step / steps) * width);
        setShown(
          [...target].map((char, i) => (i < settled || char === " " ? char : noise(char))).join(""),
        );
        if (step >= steps) window.clearInterval(interval);
      }, 45);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [target, width, delay, reduceMotion]);

  return (
    <span className={cn("whitespace-pre", className)} aria-hidden="true">
      {shown}
    </span>
  );
}

/** "Waseda University" → "Waseda": the board has room for a short name only. */
function boardName(name: string): string {
  const short = name
    .replace(/\b(The|University|Universität|Università|Universitas|College|of|de|di|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return short || name;
}

function almatyTime(): string {
  return new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Almaty" }).format(
    new Date(),
  );
}

export function DepartureBoard({ flights }: { flights: BoardFlight[] }) {
  const t = useCopy(copy);
  const [page, setPage] = useState(0);
  const [clock, setClock] = useState<string | null>(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const faceRef = useRef<HTMLDivElement>(null);

  // Upcoming deadlines only, soonest first. Worked out in the browser so the
  // statuses are right today, not as of the last time the page was built.
  const [now] = useState(() => Date.now());
  const rows: Row[] = useMemo(() => {
    return flights
      .map((flight) => ({ flight, at: Date.parse(flight.deadline) }))
      .filter(({ at }) => Number.isFinite(at) && at >= now - DAY_MS)
      .sort((a, b) => a.at - b.at)
      // Many universities in one country share a date; one row each keeps the board varied.
      .filter(({ flight, at }, i, all) => all.findIndex((x) => x.at === at && sameCountry(x.flight, flight)) === i)
      .slice(0, ROWS * 4)
      .map(({ flight, at }) => {
        const date = new Date(at);
        const days = (at - now) / DAY_MS;
        return {
          date: `${String(date.getDate()).padStart(2, "0")} ${t.months[date.getMonth()]}`,
          city: cityName(flight.city),
          uni: flight.name.length > 11 ? boardName(flight.name) : flight.name,
          status: days <= 7 ? "lastCall" : days <= 30 ? "boarding" : "onTime",
        };
      });
  }, [flights, now, t.months]);

  const pages = Math.max(1, Math.ceil(rows.length / ROWS));
  const visible = rows.slice((page % pages) * ROWS, (page % pages) * ROWS + ROWS);

  useEffect(() => {
    setClock(almatyTime());
    const tick = window.setInterval(() => setClock(almatyTime()), 15_000);
    const flip = window.setInterval(() => setPage((p) => p + 1), PAGE_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(flip);
    };
  }, []);

  // The mentor's eyes follow the pointer anywhere on the page.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = faceRef.current?.getBoundingClientRect();
        if (!box) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        setLook({ x: Math.max(-10, Math.min(10, dx / 30)), y: Math.max(-5, Math.min(6, dy / 40)) });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className="group relative pt-14">
      {/* The mentor peeks over the board; hovering it brings him up for a look. */}
      <div
        ref={faceRef}
        className="absolute top-0 right-8 z-0 w-28 transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.3)] group-hover:-translate-y-3"
      >
        <ArsFace look={look} className="w-full" />
      </div>

      <div className="relative z-10 overflow-hidden rounded-2xl bg-[#0c0c0e] p-5 text-white shadow-[0_30px_60px_-30px_rgba(11,31,58,0.55)] ring-1 ring-black/5 dark:ring-white/10">
        <div className="mb-4 flex items-center justify-between font-mono text-[11px] tracking-[0.2em] text-white/50">
          <span>
            {t.departures.toUpperCase()} · {t.from.toUpperCase()}
          </span>
          <span className="tabular-nums text-white/80">{clock ?? "--:--"}</span>
        </div>

        <div className="grid grid-cols-[4rem_1fr_auto] gap-x-3 border-b border-white/10 pb-2 font-mono text-[10px] tracking-[0.15em] text-white/35 sm:grid-cols-[4rem_6rem_1fr_auto]">
          <span>{t.date.toUpperCase()}</span>
          <span className="hidden sm:block">{t.city.toUpperCase()}</span>
          <span>{t.uni.toUpperCase()}</span>
          <span className="text-right">{t.status.toUpperCase()}</span>
        </div>

        <ul className="divide-y divide-white/[0.06]" aria-label={t.note}>
          {visible.map((row, i) => (
            <li
              key={i}
              className="grid grid-cols-[4rem_1fr_auto] items-center gap-x-3 py-2.5 font-mono text-[13px] sm:grid-cols-[4rem_6rem_1fr_auto]"
            >
              <span className="sr-only">
                {row.date}, {row.uni}, {row.city}, {t[row.status]}
              </span>
              <Flap value={row.date} width={6} delay={i * 90} className="text-[#ffd84d]" />
              <Flap value={row.city} width={10} delay={i * 90 + 60} className="hidden text-white/70 sm:block" />
              <Flap value={row.uni} width={11} delay={i * 90 + 120} />
              <Flap value={t[row.status]} width={11} delay={i * 90 + 180} className={cn("text-right", STATUS_COLOR[row.status])} />
            </li>
          ))}
        </ul>

        <p className="mt-3 font-mono text-[10px] tracking-wide text-white/35">{t.note}</p>
      </div>
    </div>
  );
}
