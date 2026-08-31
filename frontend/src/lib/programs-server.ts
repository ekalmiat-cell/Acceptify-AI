import "server-only";
import { fetchReferenceJson } from "@/lib/api-reference";
import type { EvaluationProfile, Program } from "@/types/domain";

/** All programs for a university — powers the field-of-study step and the
 * admin panel. Public reference data, so it goes through the shared cache
 * (lib/api-reference.ts); falls back to an empty list on a backend hiccup,
 * same pattern as `getUniversities`. */
export async function getProgramsByUniversity(universityId: string): Promise<Program[]> {
  return fetchReferenceJson<Program[]>(
    `/api/v1/programs?universityId=${encodeURIComponent(universityId)}`,
    "programs",
    []
  );
}

export async function getAllPrograms(): Promise<Program[]> {
  return fetchReferenceJson<Program[]>("/api/v1/programs", "programs", []);
}

/**
 * A program's evaluation weights, or `null` when it has none yet — callers
 * fall back to `DEFAULT_WEIGHTS`.
 *
 * Read through the shared reference cache rather than the per-user wrapper:
 * the endpoint is public (see `get_evaluation_profile` in
 * backend/app/api/v1/endpoints/programs.py — it takes no user dependency),
 * the answer is identical for every student, and the search page now needs
 * one of these per university. A per-user Bearer token would make the cache
 * key unique per user and turn that into a fresh round trip per navigation.
 */
export async function getEvaluationProfile(programId: string): Promise<EvaluationProfile | null> {
  return fetchReferenceJson<EvaluationProfile | null>(
    `/api/v1/programs/${encodeURIComponent(programId)}/evaluation-profile`,
    "programs",
    null
  );
}
