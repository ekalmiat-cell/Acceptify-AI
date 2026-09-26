import { reportOutcome } from "@/lib/data/predictions";
import { HttpError, json, parseUuid, readJson, requireUser, route } from "@/lib/route";
import { outcomeSchema } from "@/lib/validation";

/** Records what actually happened to one of the user's own applications. */
export const PATCH = route<{ params: Promise<{ predictionId: string }> }>(
  async (request, { params }) => {
    const user = await requireUser();
    const predictionId = parseUuid((await params).predictionId, "Prediction not found.");
    const { outcome } = await readJson(request, outcomeSchema);

    const updated = await reportOutcome(user.id, predictionId, outcome);
    if (!updated) throw new HttpError(404, "Prediction not found.");
    return json(updated);
  },
);
