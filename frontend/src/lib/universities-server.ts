import "server-only";
import { apiFetchServer } from "@/lib/api-server";
import type { University } from "@/types/domain";

/**
 * The full university catalog from Postgres (see
 * backend/app/models/university.py) — the single source of truth behind
 * search, dream-university selection, and the match prediction engine.
 * Public data, but routed through the same fetch helper as everything else
 * for consistency. Falls back to an empty list on a backend hiccup so
 * pages degrade to their empty state instead of crashing.
 */
export async function getUniversities(): Promise<University[]> {
  try {
    return await apiFetchServer<University[]>("/api/v1/universities");
  } catch {
    return [];
  }
}
