"use client";

import { apiFetch } from "@/lib/api-client";
import type { EvaluationProfile, Program } from "@/types/domain";

export async function fetchPrograms(universityId?: string): Promise<Program[]> {
  const query = universityId ? `?universityId=${encodeURIComponent(universityId)}` : "";
  return apiFetch<Program[]>(`/api/v1/programs${query}`);
}

/** Finds (or, on first use, creates) the Program for a university/field
 * pair, with a default-weighted evaluation profile already attached — see
 * `backend/app/api/v1/endpoints/programs.py::resolve_program`. This is what
 * the "Choose Your Intended Field of Study" step calls on submit. */
export async function resolveProgram(universityId: string, field: string): Promise<Program> {
  return apiFetch<Program>(
    `/api/v1/programs/resolve?universityId=${encodeURIComponent(universityId)}&field=${encodeURIComponent(field)}`,
    { method: "POST" }
  );
}

export async function fetchEvaluationProfile(programId: string): Promise<EvaluationProfile | null> {
  try {
    return await apiFetch<EvaluationProfile>(`/api/v1/programs/${encodeURIComponent(programId)}/evaluation-profile`);
  } catch {
    return null;
  }
}

export async function createProgram(payload: {
  universityId: string;
  name: string;
  field: string;
  parentProgramId?: string | null;
  description?: string | null;
}): Promise<Program> {
  return apiFetch<Program>("/api/v1/programs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProgram(
  programId: string,
  payload: Partial<{ name: string; field: string; parentProgramId: string | null; description: string | null }>
): Promise<Program> {
  return apiFetch<Program>(`/api/v1/programs/${encodeURIComponent(programId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProgram(programId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/programs/${encodeURIComponent(programId)}`, { method: "DELETE" });
}

export async function saveEvaluationProfile(
  programId: string,
  payload: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    weights: { criterionKey: string; weight: number }[];
  }
): Promise<EvaluationProfile> {
  return apiFetch<EvaluationProfile>(`/api/v1/programs/${encodeURIComponent(programId)}/evaluation-profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
