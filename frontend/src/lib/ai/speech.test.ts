import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * The mentor's voice against a fake Gemini: who may have a reply read
 * aloud, which model it lands on, and the cut that drops trailing babble.
 */

const RATE = 24_000;

/** A streamed TTS reply: `seconds` of PCM, split into server-sent events. */
function sse(seconds: number, mimeType = `audio/l16; rate=${RATE}; channels=1`): Response {
  const pcm = Buffer.alloc(Math.round(seconds * RATE) * 2, 1);
  const chunk = 3840;
  let events = "";
  for (let i = 0; i < pcm.length; i += chunk) {
    const data = pcm.subarray(i, i + chunk).toString("base64");
    events += `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType, data } }] } }] })}\r\n\r\n`;
  }
  events += `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: "" }] }, finishReason: "STOP" }] })}\r\n\r\n`;
  return new Response(events, { status: 200 });
}

function quotaError(retry = "40s"): Response {
  return new Response(JSON.stringify({ error: { code: 429, details: [{ retryDelay: retry }] } }), { status: 429 });
}

let models: string[] = [];

function fakeGemini(replies: Record<string, (() => Response)[]>) {
  models = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const model = url.split("/models/")[1].split(":")[0];
      models.push(model);
      return replies[model]?.shift()?.() ?? new Response("{}", { status: 404 });
    }),
  );
}

async function loadSpeech() {
  vi.resetModules();
  process.env.GEMINI_API_KEY = "test-key";
  process.env.BETTER_AUTH_SECRET = "test-secret";
  return import("@/lib/ai/speech");
}

async function seconds(stream: ReadableStream<Uint8Array>): Promise<number> {
  let bytes = 0;
  for await (const chunk of stream as unknown as AsyncIterable<Uint8Array>) bytes += chunk.length;
  return bytes / 2 / RATE;
}

const TEXT = "Бля, бауырым, хватит тупить, открой эссе и напиши одно предложение."; // 67 characters

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("speech tokens", () => {
  it("only lets the same user voice the same text", async () => {
    const { speechToken, isValidSpeechToken } = await loadSpeech();
    const token = speechToken("user-1", TEXT);
    expect(isValidSpeechToken("user-1", TEXT, token)).toBe(true);
    expect(isValidSpeechToken("user-2", TEXT, token)).toBe(false);
    expect(isValidSpeechToken("user-1", `${TEXT}!`, token)).toBe(false);
    expect(isValidSpeechToken("user-1", TEXT, "123.forged")).toBe(false);
    expect(isValidSpeechToken("user-1", TEXT, "garbage")).toBe(false);
  });

  it("expires after half an hour", async () => {
    const { speechToken, isValidSpeechToken } = await loadSpeech();
    vi.useFakeTimers();
    try {
      const token = speechToken("user-1", TEXT);
      vi.advanceTimersByTime(31 * 60 * 1000);
      expect(isValidSpeechToken("user-1", TEXT, token)).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("streamSpeech", () => {
  it("passes a normal-length reply through whole", async () => {
    const { streamSpeech } = await loadSpeech();
    fakeGemini({ "gemini-3.8-flash-lite-tts": [() => sse(4.4)] });
    expect(await seconds(await streamSpeech(TEXT, "friendly"))).toBeCloseTo(4.4, 1);
    expect(models).toEqual(["gemini-3.8-flash-lite-tts"]);
  });

  it("cuts the babble a model adds after the last word", async () => {
    const { streamSpeech } = await loadSpeech();
    fakeGemini({ "gemini-3.8-flash-lite-tts": [() => sse(13.4)] });
    // 1.5 s + 67 characters at 11 per second.
    expect(await seconds(await streamSpeech(TEXT, "uncensored"))).toBeCloseTo(1.5 + 67 / 11, 1);
  });

  it("falls back to the next model when one is out of quota, and skips it afterwards", async () => {
    const { streamSpeech } = await loadSpeech();
    fakeGemini({
      "gemini-3.8-flash-lite-tts": [quotaError],
      "gemini-3.8-flash-tts": [() => sse(4), () => sse(4)],
    });
    await seconds(await streamSpeech(TEXT, "friendly"));
    await seconds(await streamSpeech(TEXT, "friendly"));
    expect(models).toEqual(["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts", "gemini-3.8-flash-tts"]);
  });

  it("refuses audio at a sample rate it would play as noise", async () => {
    const { streamSpeech } = await loadSpeech();
    fakeGemini({
      "gemini-3.8-flash-lite-tts": [() => sse(4, "audio/l16; rate=16000")],
      "gemini-3.8-flash-tts": [() => sse(4)],
    });
    expect(await seconds(await streamSpeech(TEXT, "friendly"))).toBeCloseTo(4, 1);
    expect(models).toEqual(["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"]);
  });

  it("says the voice is busy when no model can speak", async () => {
    const { streamSpeech } = await loadSpeech();
    fakeGemini({});
    await expect(streamSpeech(TEXT, "friendly")).rejects.toMatchObject({ status: 503 });
  });

  it("reports the voice as down once every model is out of quota, so no turn is spent on it", async () => {
    const { streamSpeech, speechAvailable, SPEECH_MODELS } = await loadSpeech();
    expect(speechAvailable()).toBe(true);
    fakeGemini(Object.fromEntries(SPEECH_MODELS.map((model) => [model, [() => quotaError("30677s")]])));
    await expect(streamSpeech(TEXT, "friendly")).rejects.toMatchObject({ status: 503 });
    expect(speechAvailable()).toBe(false);
  });
});
