import { recordDrillDone, resolveDrill } from "@/lib/data/training";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { trainingCompleteSchema } from "@/lib/validation";

/** Marks a training drill finished and returns the student's updated progress. */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, trainingCompleteSchema);

  if (!(await resolveDrill(user.id, input.drill_id))) {
    throw new HttpError(404, "That drill was not found.");
  }

  return json(await recordDrillDone(user.id, input.drill_id));
});
