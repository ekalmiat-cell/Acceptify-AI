import "server-only";
import { apiFetchServer } from "@/lib/api-server";
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

/** A program's evaluation weights. Returns `null` if the program has no
 * evaluation profile yet — callers should fall back to `DEFAULT_WEIGHTS`. */
export async function getEvaluationProfile(programId: string): Promise<EvaluationProfile | null> {
  try {
    return await apiFetchServer<EvaluationProfile>(
      `/api/v1/programs/${encodeURIComponent(programId)}/evaluation-profile`
    );
  } catch {
    return null;
  }
}
