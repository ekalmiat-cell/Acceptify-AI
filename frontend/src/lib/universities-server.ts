import "server-only";
import { fetchReferenceJson } from "@/lib/api-reference";
import type { University } from "@/types/domain";

/**
 * The full university catalog from Postgres (see
 * backend/app/models/university.py) — the single source of truth behind
 * search, dream-university selection, and the match prediction engine.
 * Public data, so it is read through the shared reference cache rather than
 * the per-user API wrapper — see lib/api-reference.ts for why that matters
 * for navigation speed. Falls back to an empty list on a backend hiccup so
 * pages degrade to their empty state instead of crashing.
 */
export async function getUniversities(): Promise<University[]> {
  return fetchReferenceJson<University[]>(
    "/api/v1/universities",
    "universities",
    [],
  );
}
