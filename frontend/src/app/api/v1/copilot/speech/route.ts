import { isValidSpeechToken, SPEECH_SAMPLE_RATE, streamSpeech } from "@/lib/ai/speech";
import { assertAiAvailable, isMockAi } from "@/lib/ai/gemini";
import { HttpError, readJson, requireUser, route } from "@/lib/route";
import { copilotSpeechSchema } from "@/lib/validation";

export const maxDuration = 60;

/**
 * Reads one of the copilot's own spoken replies aloud as streamed PCM. The
 * turn was already counted against the daily voice limit by the chat route;
 * the token proves the text is that reply.
 */
export const POST = route(async (request) => {
  const user = await requireUser();
  const input = await readJson(request, copilotSpeechSchema);
  if (!isValidSpeechToken(user.id, input.text, input.token)) {
    throw new HttpError(403, "This reply can't be read aloud anymore.");
  }
  assertAiAvailable();
  // Locally without a key the browser's own voice reads the reply instead.
  if (isMockAi()) throw new HttpError(503, "Voice is not available in mock mode.");

  const audio = await streamSpeech(input.text, input.style);
  return new Response(audio, {
    headers: {
      "Content-Type": `audio/l16; rate=${SPEECH_SAMPLE_RATE}; channels=1`,
      "Cache-Control": "no-store",
    },
  });
});
