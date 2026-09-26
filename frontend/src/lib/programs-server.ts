import "server-only";

import { getEvaluationProfile, listPrograms } from "@/lib/data/programs";
import type { Program } from "@/types/domain";

/** All programs at one university — the field-of-study step and admin panel. */
export async function getProgramsByUniversity(universityId: string): Promise<Program[]> {
  return listPrograms(universityId);
}

export async function getAllPrograms(): Promise<Program[]> {
  return listPrograms();
}

/** A program's evaluation weights, or `null` when it has none yet — callers
 * fall back to `DEFAULT_WEIGHTS`. */
export { getEvaluationProfile };
