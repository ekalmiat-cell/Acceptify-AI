import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env.server";
import { HttpError } from "@/lib/http-error";
import type { CopilotStyle } from "@/types/copilot";

/**
 * The mentor's voice: Gemini's text-to-speech, streamed. Even the cheapest
 * TTS model sounds like a person (the browser's own voices do not), and
 * streaming starts the first words about a second after the request instead
 * of after the whole clip is rendered.
 *
 * Only replies the copilot itself wrote can be voiced: the chat route signs
 * each spoken reply (`speechToken`) and the speech route checks the
 * signature, so the endpoint cannot be used to read out arbitrary text on
 * our credit.
 */

/**
 * Tried in order. The first is the cheapest; on the free tier each model has
 * its own tiny quota (3 a minute, 10 a day), so the others add to it.
 */
export const SPEECH_MODELS = [
  "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts",
  "gemini-2.5-flash-preview-tts",
  "gemini-3.1-flash-tts-preview",
];
const SPEECH_VOICE = "Puck";
const SPEECH_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
/** Gemini's TTS answers with 16-bit mono PCM at this rate. */
export const SPEECH_SAMPLE_RATE = 24_000;
/** Long enough to replay a reply a little later, short enough that a leaked token goes stale. */
const TOKEN_TTL_MS = 30 * 60 * 1000;
const FIRST_AUDIO_TIMEOUT_MS = 15_000;
/** Bounds on how long a reply can take to say; see the cut in streamSpeech. */
const MIN_SPEECH_SECONDS = 1.5;
const SLOWEST_CHARS_PER_SECOND = 11;
/** A model out of quota is retried after Google's own delay, but at least this often. */
const MAX_PAUSE_MS = 60 * 60 * 1000;

/** Until when Google refuses each model (per server instance). */
const limitedUntil = new Map<string, number>();

/** How the voice should sound; the words themselves come from the copilot. */
const DELIVERY: Record<CopilotStyle, string> = {
  friendly: "Say this like a warm, relaxed young guy talking to his younger friend, natural and friendly:",
  strict: "Say this like a blunt, confident older friend who is teasing and pushing his friend to get to work:",
  uncensored:
    "Say this like a cocky, energetic young guy from Almaty talking to his close friend: fast, casual, teasing, swearing naturally:",
};

function sign(userId: string, issuedAt: number, text: string): string {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`speech\n${userId}\n${issuedAt}\n${text}`)
    .digest("base64url");
}

/** Lets this user have `text` read aloud for the next half hour. */
export function speechToken(userId: string, text: string): string {
  const issuedAt = Date.now();
  return `${issuedAt}.${sign(userId, issuedAt, text)}`;
}

export function isValidSpeechToken(userId: string, text: string, token: string): boolean {
  const [issued, signature] = token.split(".");
  const issuedAt = Number(issued);
  if (!signature || !Number.isFinite(issuedAt) || Date.now() - issuedAt > TOKEN_TTL_MS) return false;
  const expected = Buffer.from(sign(userId, issuedAt, text));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

interface SpeechEvent {
  candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
}

/** Turns a server-sent-events stream from Gemini into its audio, chunk by chunk. */
function audioReader(body: NonNullable<Response["body"]>) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffered = "";

  /** The audio carried by the next complete events, or null at the end. */
  async function next(): Promise<Uint8Array | null> {
    for (;;) {
      const events = buffered.split(/\r?\n\r?\n/);
      buffered = events.pop() ?? "";
      const chunks = events.flatMap((event) => {
        const line = event.split(/\r?\n/).find((l) => l.startsWith("data: "));
        if (!line) return [];
        const parsed = JSON.parse(line.slice(6)) as SpeechEvent;
        return (parsed.candidates?.[0]?.content?.parts ?? []).flatMap(({ inlineData }) => {
          if (!inlineData?.data) return [];
          // Played as 24 kHz PCM; anything else would come out as noise.
          const rate = inlineData.mimeType?.match(/rate=(\d+)/)?.[1];
          if (rate && Number(rate) !== SPEECH_SAMPLE_RATE) throw new Error(`unexpected audio ${inlineData.mimeType}`);
          return [Buffer.from(inlineData.data, "base64")];
        });
      });
      if (chunks.length) return new Uint8Array(Buffer.concat(chunks));

      const { done, value } = await reader.read();
      if (done) return null;
      buffered += value;
    }
  }

  return { next, cancel: () => void reader.cancel().catch(() => {}) };
}

/** One model's stream, once its first audio is in; null if this model can't serve it now. */
async function openStream(model: string, apiKey: string, text: string, style: CopilotStyle) {
  // A deadline for the first audio only: the rest of the clip keeps streaming.
  const abort = new AbortController();
  const deadline = setTimeout(() => abort.abort(), FIRST_AUDIO_TIMEOUT_MS);
  try {
    const response = await fetch(`${SPEECH_ENDPOINT}/${model}:streamGenerateContent?alt=sse`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${DELIVERY[style]}\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: SPEECH_VOICE } } },
        },
      }),
      signal: abort.signal,
      cache: "no-store",
    });

    if (!response.ok || !response.body) {
      const body = await response.text().catch(() => "");
      console.error(`[speech] ${model}: HTTP ${response.status} ${body.slice(0, 300)}`);
      if (response.status === 429 || response.status === 404) {
        // Out of quota (or not offered to this key): skip it for a while
        // instead of spending a round trip on it for every reply.
        const retry = Number(body.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1] ?? 60) * 1000;
        limitedUntil.set(model, Date.now() + (response.status === 404 ? MAX_PAUSE_MS : Math.min(retry, MAX_PAUSE_MS)));
      }
      return null;
    }

    const audio = audioReader(response.body);
    const first = await audio.next();
    if (!first) {
      console.error(`[speech] ${model}: no audio in the reply`);
      return null;
    }
    return { audio, first };
  } catch (error) {
    console.error(`[speech] ${model}: failed before any audio`, error);
    return null;
  } finally {
    clearTimeout(deadline);
  }
}

/**
 * Whether some voice model is worth trying right now, so a spoken turn is
 * not spent on a reply that cannot be voiced.
 */
export function speechAvailable(): boolean {
  if (!env.GEMINI_API_KEY) return false;
  const now = Date.now();
  return SPEECH_MODELS.some((model) => (limitedUntil.get(model) ?? 0) <= now);
}

/**
 * Raw PCM (see SPEECH_SAMPLE_RATE) as Gemini renders it. Resolves once the
 * first audio has arrived, so a failure before that is still an HTTP error
 * the client can answer with the browser's own voice.
 */
export async function streamSpeech(text: string, style: CopilotStyle): Promise<ReadableStream<Uint8Array>> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, "AI features are not set up on this server yet (GEMINI_API_KEY is missing).");

  const now = Date.now();
  let opened: Awaited<ReturnType<typeof openStream>> = null;
  for (const model of SPEECH_MODELS.filter((m) => (limitedUntil.get(m) ?? 0) <= now)) {
    opened = await openStream(model, apiKey, text, style);
    if (opened) break;
  }
  if (!opened) throw new HttpError(503, "The voice is busy right now. Please try again later.");
  const { audio, first } = opened;

  // The models often run on for seconds of babble after the last word. Real
  // speech is never much slower than this, so anything past it is cut.
  const maxSeconds = MIN_SPEECH_SECONDS + text.length / SLOWEST_CHARS_PER_SECOND;
  let budget = Math.round(maxSeconds * SPEECH_SAMPLE_RATE) * 2;
  let pending: Uint8Array | null = first;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const chunk = pending ?? (await audio.next());
        pending = null;
        if (!chunk || budget <= 0) {
          if (chunk) audio.cancel();
          return controller.close();
        }
        const allowed = chunk.subarray(0, Math.min(chunk.length, budget));
        budget -= allowed.length;
        controller.enqueue(allowed);
      } catch (error) {
        console.error("[speech] stream broke off", error);
        controller.close();
      }
    },
    cancel() {
      audio.cancel();
    },
  });
}
