import { revalidateTag } from "next/cache";

import { deleteProgram, getProgram, PROGRAMS_TAG, updateProgram } from "@/lib/data/programs";
import { HttpError, json, noContent, readJson, requireAdmin, route } from "@/lib/route";
import { programUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ programId: string }> };

export const GET = route<Context>(async (_request, { params }) => {
  const program = await getProgram((await params).programId);
  if (!program) throw new HttpError(404, "Program not found.");
  return json(program);
});

export const PUT = route<Context>(async (request, { params }) => {
  await requireAdmin();
  const { programId } = await params;
  const patch = await readJson(request, programUpdateSchema);

  const existing = await getProgram(programId);
  if (!existing) throw new HttpError(404, "Program not found.");

  if (patch.parentProgramId) {
    const parent = await getProgram(patch.parentProgramId);
    if (
      patch.parentProgramId === programId ||
      !parent ||
      parent.universityId !== existing.universityId
    ) {
      throw new HttpError(422, "The parent program must be another program at the same university.");
    }
  }

  const program = await updateProgram(programId, patch);
  if (!program) throw new HttpError(404, "Program not found.");
  revalidateTag(PROGRAMS_TAG);
  return json(program);
});

export const DELETE = route<Context>(async (_request, { params }) => {
  await requireAdmin();
  const deleted = await deleteProgram((await params).programId);
  if (!deleted) throw new HttpError(404, "Program not found.");
  revalidateTag(PROGRAMS_TAG);
  return noContent();
});
