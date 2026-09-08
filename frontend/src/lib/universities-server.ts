import "server-only";
import { fetchReferenceJson } from "@/lib/api-reference";
import fallbackUniversities from "@/data/universities.json";
import type { University } from "@/types/domain";

/**
 * The full university catalog from Postgres (see
 * backend/app/models/university.py) — the single source of truth behind
 * search, dream-university selection, and the match prediction engine.
 * Public data, so it is read through the shared reference cache rather than
 * the per-user API wrapper — see lib/api-reference.ts for why that matters
 * for navigation speed. Falls back to static snapshot when the backend is
 * unreachable so the catalog is always available.
 */
export async function getUniversities(): Promise<University[]> {
  const result = await fetchReferenceJson<University[]>(
    "/api/v1/universities",
    "universities",
    fallbackUniversities as University[],
  );
  return result && result.length > 0 ? result : (fallbackUniversities as University[]);
}
