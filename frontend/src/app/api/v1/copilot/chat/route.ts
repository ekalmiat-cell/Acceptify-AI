import { buildCopilotContext } from "@/lib/ai/context";
import { runCopilotChat } from "@/lib/ai/copilot";
import { assertAiAvailable } from "@/lib/ai/gemini";
import { speechAvailable, speechToken } from "@/lib/ai/speech";
import { isAdminUser } from "@/lib/admin";
import { dailyLimit } from "@/lib/ai-limits";
import { withAiErrorLog } from "@/lib/data/ai-errors";
import { aiAllowanceLeft, consumeAiAllowance } from "@/lib/data/ai-usage";
import { HttpError, json, readJson, requireUser, route } from "@/lib/route";
import { copilotChatSchema } from "@/lib/validation";

export const maxDuration = 120;

/** What the student has left today, so the mentor can look tired before a turn fails. */
export const GET = route(async () => {
  const user = await requireUser();
  const admin = isAdminUser(user);
  const [text, voice] = await Promise.all([
    aiAllowanceLeft(user.id, "copilot"),
    aiAllowanceLeft(user.id, "copilot_voice", admin),
  ]);
  return json({ text_left: text, voice_left: voice, voice_total: dailyLimit("copilot_voice", admin) });
});

/** One turn of the admissions copilot conversation, typed or spoken. */
export const POST = route(async (request) =>
  withAiErrorLog("copilot", async () => {
    const user = await requireUser();
    const input = await readJson(request, copilotChatSchema);
    const feature = input.mode === "voice" ? "copilot_voice" : "copilot";
    // The admin gets more voice turns, to try things out.
    const admin = isAdminUser(user);

    assertAiAvailable();
    // A spoken reply nobody can hear would still cost the student a turn.
    if (input.mode === "voice" && !speechAvailable()) {
      throw new HttpError(503, "The mentor's voice is not working right now.");
    }
    await consumeAiAllowance(user.id, feature, admin);

    const context = input.include_context ? await buildCopilotContext(user.id) : null;
    const reply = await runCopilotChat(input.messages, context, input.mode, input.lang, input.style);
    return json({
      ...reply,
      left: await aiAllowanceLeft(user.id, feature, admin),
      ...(input.mode === "voice" ? { speech_token: speechToken(user.id, reply.reply) } : {}),
    });
  }),
);
