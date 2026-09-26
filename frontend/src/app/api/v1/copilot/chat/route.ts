import { buildCopilotContext } from "@/lib/ai/context";
import { runCopilotChat } from "@/lib/ai/copilot";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { consumeAiAllowance } from "@/lib/data/ai-usage";
import { json, readJson, requireUser, route } from "@/lib/route";
import { copilotChatSchema } from "@/lib/validation";

export const maxDuration = 60;

/** One turn of the admissions copilot conversation. */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, copilotChatSchema);

  assertAiAvailable();
  await consumeAiAllowance(user.id, "copilot");

  const context = input.include_context ? await buildCopilotContext(user.id) : null;
  return json(await runCopilotChat(input.messages, context));
});
