import { coachDrill } from "@/lib/ai/drill-feedback";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { withAiErrorLog } from "@/lib/data/ai-errors";
import { aiAllowanceLeft, consumeAiAllowance } from "@/lib/data/ai-usage";
import { resolveDrill } from "@/lib/data/training";
import { getLocale } from "@/lib/i18n/server";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { findUnit } from "@/lib/training/drills";
import { drillFeedbackSchema } from "@/lib/validation";
import type { DrillFeedbackResponse } from "@/types/training";

export const maxDuration = 60;

/** The AI coach's note on one attempt at a rewrite drill. */
export const POST = route(async (request) =>
  withAiErrorLog("training_feedback", async () => {
    const user = await requireUser();
    const input = await readJson(request, drillFeedbackSchema);

    // The task and weak text come from the drill itself, never the browser.
    const drill = await resolveDrill(user.id, input.drill_id);
    if (!drill) throw new HttpError(404, "That drill was not found.");
    if (drill.kind !== "rewrite") throw new HttpError(422, "The AI coach only reviews written answers.");

    assertAiAvailable();
    await consumeAiAllowance(user.id, "training_feedback");

    const unit = findUnit(drill.unit);
    const feedback = await coachDrill({
      drill,
      skill: `${unit.title.en}: ${unit.lesson.en}`,
      answer: input.answer,
      // Explanations in the interface language; the essay phrase stays English.
      language: await getLocale(),
    });

    const response: DrillFeedbackResponse = {
      feedback,
      left: await aiAllowanceLeft(user.id, "training_feedback"),
    };
    return json(response);
  }),
);
