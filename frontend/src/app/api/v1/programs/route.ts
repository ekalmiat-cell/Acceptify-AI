import { revalidateTag } from "next/cache";

import { createProgram, getProgram, listPrograms, PROGRAMS_TAG } from "@/lib/data/programs";
import { universityExists } from "@/lib/data/universities";
import { HttpError, json, readJson, requireAdmin, route } from "@/lib/route";
import { programCreateSchema } from "@/lib/validation";

/** Public reference data: every program, or `?universityId=` for one school. */
export const GET = route(async (request) => {
  const universityId = new URL(request.url).searchParams.get("universityId") ?? undefined;
  return json(await listPrograms(universityId));
});

/** Admin-only: the catalog's weights decide how every student is scored. */
export const POST = route(async (request) => {
  await requireAdmin();
  const input = await readJson(request, programCreateSchema);

  if (!(await universityExists(input.universityId))) {
    throw new HttpError(404, "University not found.");
  }
  if (input.parentProgramId) {
    const parent = await getProgram(input.parentProgramId);
    if (!parent || parent.universityId !== input.universityId) {
      throw new HttpError(422, "The parent program must belong to the same university.");
    }
  }

  const program = await createProgram(input);
  revalidateTag(PROGRAMS_TAG);
  return json(program, 201);
});
