import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `generateJson` against a fake Gemini: which model it lands on, when it
 * falls back, and what the student is told when it cannot.
 */

type Reply = { status: number; body: unknown };

function geminiOk(json: unknown): Reply {
  return {
    status: 200,
    body: { candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] },
  };
}

function geminiError(status: number, message: string, code = "ERROR"): Reply {
  return { status, body: { error: { code: status, message, status: code } } };
}

let calls: { model: string; body: Record<string, unknown> }[] = [];

function fakeGemini(replies: Record<string, Reply[]>) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const model = url.split("/models/")[1].split(":")[0];
      calls.push({ model, body: JSON.parse(String(init.body)) });
      const reply = replies[model]?.shift() ?? geminiError(404, `models/${model} is not found`);
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
}

async function loadGemini(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  process.env.GEMINI_API_KEY = "test-key";
  delete process.env.GEMINI_MODEL;
  delete process.env.AI_PROVIDER;
  Object.assign(process.env, env);
  return import("@/lib/ai/gemini");
}

const request = {
  system: "system",
  messages: [{ role: "user" as const, text: "hi" }],
  temperature: 0.5,
  schema: { type: "OBJECT" as const, properties: { ok: { type: "BOOLEAN" as const } } },
};

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("generateJson", () => {
  it("uses the newest model first and sends the schema", async () => {
    fakeGemini({ "gemini-3.8-flash": [geminiOk({ ok: true })] });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls.map((c) => c.model)).toEqual(["gemini-3.8-flash"]);
    expect(calls[0].body.generationConfig).toMatchObject({ responseSchema: request.schema });
  });

  it("falls back when a model is unknown or not on the key's free tier", async () => {
    fakeGemini({
      "gemini-3.8-flash": [geminiError(429, "Quota exceeded ... limit: 0, model: gemini-3.8-flash")],
      "gemini-3.7-flash": [geminiOk({ ok: 1 })],
    });
    const { generateJson } = await loadGemini({ GEMINI_MODEL: "gemini-3.8" });

    await expect(generateJson(request)).resolves.toEqual({ ok: 1 });
    expect(calls.map((c) => c.model)).toEqual(["gemini-3.8", "gemini-3.8-flash", "gemini-3.7-flash"]);
  });

  it("retries without the schema when the model rejects it", async () => {
    fakeGemini({
      "gemini-3.8-flash": [
        geminiError(400, "Invalid JSON payload: unknown field in responseSchema"),
        geminiOk({ ok: true }),
      ],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(calls[1].body.generationConfig).not.toHaveProperty("responseSchema");
  });

  it("moves on when a model is overloaded or rate-limited (quotas are per model)", async () => {
    fakeGemini({
      "gemini-3.8-flash": [geminiError(503, "This model is currently experiencing high demand.", "UNAVAILABLE")],
      "gemini-3.7-flash": [geminiError(429, "Resource exhausted, retry later")],
      "gemini-3.5-flash": [geminiOk({ ok: true })],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls.map((c) => c.model)).toEqual([
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ]);
  });

  it("goes round again after a pause when every model is overloaded at once", async () => {
    const overloaded = () => geminiError(503, "high demand", "UNAVAILABLE");
    fakeGemini({
      "gemini-3.8-flash": [overloaded(), geminiOk({ ok: "second round" })],
      "gemini-3.7-flash": [overloaded()],
      "gemini-3.6-flash": [geminiError(404, "models/gemini-3.6-flash is not found")],
      "gemini-3.5-flash": [overloaded()],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ ok: "second round" });
    // The unknown model is dropped after the first pass.
    expect(calls.map((c) => c.model)).toEqual([
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.8-flash",
    ]);
  });

  it("tells the student Google is overloaded when it stays that way", async () => {
    const overloaded = () => geminiError(503, "high demand", "UNAVAILABLE");
    fakeGemini({
      "gemini-3.8-flash": [overloaded(), overloaded(), overloaded()],
      "gemini-3.7-flash": [overloaded(), overloaded(), overloaded()],
      "gemini-3.6-flash": [overloaded(), overloaded(), overloaded()],
      "gemini-3.5-flash": [overloaded(), overloaded(), overloaded()],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).rejects.toMatchObject({
      status: 503,
      message: "Google's AI is overloaded right now. Please try again in a minute.",
    });
    expect(calls).toHaveLength(12);
  }, 15_000);

  it("reports 'busy' rather than 'no model' when every model is rate-limited", async () => {
    fakeGemini({
      "gemini-3.8-flash": [geminiError(429, "Resource exhausted")],
      "gemini-3.7-flash": [geminiError(429, "Resource exhausted")],
      "gemini-3.5-flash": [geminiError(404, "models/gemini-3.5-flash is not found")],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).rejects.toMatchObject({ status: 429 });
  });

  it("tries the next model when one returns an unreadable answer", async () => {
    fakeGemini({
      "gemini-3.8-flash": [
        { status: 200, body: { candidates: [{ content: { parts: [{ text: "not json" }] } }] } },
      ],
      "gemini-3.7-flash": [geminiOk({ ok: true })],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
  });

  it("reports a rejected key clearly, keeping Google's message for the logs", async () => {
    fakeGemini({
      "gemini-3.8-flash": [geminiError(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT")],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).rejects.toMatchObject({
      status: 503,
      message: "The AI service is misconfigured: the GEMINI_API_KEY was rejected.",
      upstream: "400 INVALID_ARGUMENT: API key not valid. Please pass a valid API key.",
    });
  });

  it("ignores thinking parts and reads only the answer", async () => {
    fakeGemini({
      "gemini-3.8-flash": [
        {
          status: 200,
          body: {
            candidates: [
              {
                content: {
                  parts: [{ text: "let me think", thought: true }, { text: '{"reply":"hi"}' }],
                },
              },
            ],
          },
        },
      ],
    });
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).resolves.toEqual({ reply: "hi" });
  });

  it("says so when no model is available at all", async () => {
    fakeGemini({});
    const { generateJson } = await loadGemini();

    await expect(generateJson(request)).rejects.toMatchObject({
      status: 503,
      message: "None of the configured AI models are available to this API key.",
    });
  });
});
