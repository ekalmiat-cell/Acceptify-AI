import { revalidateTag } from "next/cache";

import {
  getEvaluationProfile,
  getProgram,
  PROGRAMS_TAG,
  saveEvaluationProfile,
} from "@/lib/data/programs";
import { HttpError, json, readJson, requireAdmin, route } from "@/lib/route";
import { evaluationProfileSchema } from "@/lib/validation";

type Context = { params: Promise<{ programId: string }> };

/** Public: the scoring engine reads a program's weights from here. */
export const GET = route<Context>(async (_request, { params }) => {
  const { programId } = await params;
  if (!(await getProgram(programId))) throw new HttpError(404, "Program not found.");

  const profile = await getEvaluationProfile(programId);
  if (!profile) throw new HttpError(404, "No evaluation profile for this program yet.");
  return json(profile);
});

/** Admin-only. `weights`, when sent, replaces the entire set. */
export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();
  const program = await getProgram((await params).programId);
  if (!program) throw new HttpError(404, "Program not found.");

  const input = await readJson(request, evaluationProfileSchema);
  const profile = await saveEvaluationProfile(program, input);
  revalidateTag(PROGRAMS_TAG);
  return json(profile);
});
