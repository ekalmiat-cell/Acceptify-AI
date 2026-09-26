import { revalidateTag } from "next/cache";

import { PROGRAMS_TAG, resolveProgram } from "@/lib/data/programs";
import { universityExists } from "@/lib/data/universities";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import { HttpError, json, requireUser, route } from "@/lib/route";

const KNOWN_FIELDS = new Set<string>(FIELDS_OF_STUDY);

/**
 * Finds — or on first use creates, with default weights — the program for a
 * (university, field of study) pair. Any signed-in student may call it, so
 * the field must be one of the fixed list; otherwise students could fill the
 * shared catalog with arbitrary programs.
 */
export const POST = route(async (request) => {
  await requireUser();
  const params = new URL(request.url).searchParams;
  const universityId = params.get("universityId")?.trim();
  const field = params.get("field")?.trim();

  if (!universityId || !field) {
    throw new HttpError(422, "universityId and field are required.");
  }
  if (!KNOWN_FIELDS.has(field)) {
    throw new HttpError(422, "Unknown field of study.");
  }
  if (!(await universityExists(universityId))) {
    throw new HttpError(404, "University not found.");
  }

  const program = await resolveProgram(universityId, field);
  revalidateTag(PROGRAMS_TAG);
  return json(program);
});
