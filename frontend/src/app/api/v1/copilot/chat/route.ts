import { buildCopilotContext } from "@/lib/ai/context";
import { runCopilotChat } from "@/lib/ai/copilot";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { withAiErrorLog } from "@/lib/data/ai-errors";
import { aiAllowanceLeft, consumeAiAllowance } from "@/lib/data/ai-usage";
import { json, readJson, requireUser, route } from "@/lib/route";
import { copilotChatSchema } from "@/lib/validation";

export const maxDuration = 120;

/** What the student has left today, so Ars can look tired before a turn fails. */
export const GET = route(async () => {
  const user = await requireUser();
  const [text, voice] = await Promise.all([
    aiAllowanceLeft(user.id, "copilot"),
    aiAllowanceLeft(user.id, "copilot_voice"),
  ]);
  return json({ text_left: text, voice_left: voice });
});

/** One turn of the admissions copilot conversation, typed or spoken. */
export const POST = route(async (request) =>
  withAiErrorLog("copilot", async () => {
    const user = await requireUser();
    const input = await readJson(request, copilotChatSchema);
    const feature = input.mode === "voice" ? "copilot_voice" : "copilot";

    assertAiAvailable();
    await consumeAiAllowance(user.id, feature);

    const context = input.include_context ? await buildCopilotContext(user.id) : null;
    const reply = await runCopilotChat(input.messages, context, input.mode);
    return json({ ...reply, left: await aiAllowanceLeft(user.id, feature) });
  }),
);
