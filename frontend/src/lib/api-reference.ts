import "server-only";
import { cache } from "react";

import { env } from "@/lib/env.server";

/**
 * How long a reference-data response is served from Next's data cache before
 * the next request refreshes it in the background. Universities and programs
 * change when an admin edits them, not per page view.
 */
export const REFERENCE_REVALIDATE_SECONDS = 300;

/**
 * Reads a *public* backend endpoint (`/universities`, `/programs`) through
 * Next's data cache.
 *
 * These are deliberately fetched without an Authorization header: the data is
 * identical for everyone, and a per-user Bearer token would make the cache key
 * unique per user, so every navigation would hit the backend again. The
 * catalog is ~300 KB of JSON that up to ten dashboard pages ask for, so this
 * is the difference between one backend round trip every few minutes and one
 * on every single navigation.
 *
 * `cache()` on top of that dedupes repeat calls inside one render — a couple
 * of pages ask for the university list twice.
 */
export const fetchReferenceJson = cache(
  async <T>(path: string, tag: string, fallback: T): Promise<T> => {
    try {
      const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: REFERENCE_REVALIDATE_SECONDS, tags: [tag] },
      });

      if (!res.ok) {
        console.error(`[reference] ${path} responded ${res.status}`);
        return fallback;
      }

      return (await res.json()) as T;
    } catch (error) {
      // Same contract as before: a backend hiccup degrades the page to its
      // empty state instead of crashing it.
      console.error(`[reference] ${path} failed`, error);
      return fallback;
    }
  },
);
