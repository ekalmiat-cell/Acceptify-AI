import { createPrediction, listPredictions } from "@/lib/data/predictions";
import { universityExists } from "@/lib/data/universities";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { predictionSchema } from "@/lib/validation";

/** The signed-in user's own prediction history, newest first. */
export const GET = route(async () => {
  const user = await requireUser();
  return json(await listPredictions(user.id));
});

/** Saves one run of the admission analysis to the user's history. */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, predictionSchema);

  if (!(await universityExists(input.universityId))) {
    throw new HttpError(422, "That university is not in the catalog.");
  }

  return json(await createPrediction(user.id, input), 201);
});
