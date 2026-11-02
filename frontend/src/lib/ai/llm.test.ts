import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `generateJson` across providers against a fake network: which provider and
 * model answer, how it steps down when a request is refused, and what the
 * student hears when nothing can answer.
 */

type Reply = { status: number; body: unknown; headers?: Record<string, string> };

const chatOk = (json: unknown, content?: string): Reply => ({
  status: 200,
  body: { choices: [{ message: { content: content ?? JSON.stringify(json) }, finish_reason: "stop" }] },
});
const chatError = (status: number, message: string, headers?: Record<string, string>): Reply => ({
  status,
  body: { error: { message, code: "x" } },
  headers,
});
const geminiOk = (json: unknown): Reply => ({
  status: 200,
  body: { candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] },
});

interface Call {
  url: string;
  model: string;
  auth: string | null;
  body: Record<string, unknown>;
}
let calls: Call[] = [];

/** Replies are queued per "host|model"; an unqueued model is "not found". */
function fakeNetwork(replies: Record<string, Reply[]>) {
  calls = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const headers = new Headers(init.headers);
      const isGemini = url.includes("generativelanguage");
      const host = isGemini ? "gemini" : new URL(url).hostname.split(".").slice(-2, -1)[0];
      const model = isGemini ? url.split("/models/")[1].split(":")[0] : body.model;
      calls.push({ url, model, auth: headers.get("authorization") ?? headers.get("x-goog-api-key"), body });
      const reply = replies[`${host}|${model}`]?.shift() ?? chatError(404, `model ${model} not found`);
      return new Response(JSON.stringify(reply.body), { status: reply.status, headers: reply.headers });
    }),
  );
}

async function load(env: Record<string, string | undefined> = {}) {
  vi.resetModules();
  delete (globalThis as { __acceptifyCompatCooldowns?: unknown }).__acceptifyCompatCooldowns;
  delete (globalThis as { __acceptifyGeminiExhausted?: unknown }).__acceptifyGeminiExhausted;
  for (const key of [
    "AI_PROVIDER",
    "GROQ_API_KEY",
    "GROQ_MODEL",
    "CEREBRAS_API_KEY",
    "CEREBRAS_MODEL",
    "OPENROUTER_API_KEY",
    "GEMINI_API_KEY",
    "GEMINI_MODEL",
  ]) {
    delete process.env[key];
  }
  Object.assign(process.env, env);
  return import("@/lib/ai/llm");
}

const request = {
  system: "system",
  messages: [{ role: "user" as const, text: "hi" }],
  temperature: 0.5,
  schema: {
    type: "OBJECT" as const,
    properties: { ok: { type: "BOOLEAN" as const }, note: { type: "STRING" as const, nullable: true } },
    required: ["ok"],
  },
};

beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("provider order", () => {
  it("defaults to every provider that has a key: Groq before Gemini", async () => {
    const { configuredProviders } = await load({ GEMINI_API_KEY: "g", GROQ_API_KEY: "k" });
    expect(configuredProviders()).toEqual(["groq", "gemini"]);
  });

  it("follows AI_PROVIDER and skips providers without a key", async () => {
    const { configuredProviders } = await load({
      AI_PROVIDER: "cerebras, groq,gemini,nonsense",
      GROQ_API_KEY: "k",
      GEMINI_API_KEY: "g",
    });
    expect(configuredProviders()).toEqual(["groq", "gemini"]);
  });

  it("is Gemini alone when only the Gemini key exists", async () => {
    const { configuredProviders } = await load({ GEMINI_API_KEY: "g" });
    expect(configuredProviders()).toEqual(["gemini"]);
  });

  it("reports mock mode and refuses when nothing is configured", async () => {
    const mock = await load({ AI_PROVIDER: "mock" });
    expect(mock.isMockAi()).toBe(true);
    mock.assertAiAvailable();

    const none = await load();
    expect(() => none.assertAiAvailable()).toThrowError(/not set up/);
  });
});

describe("generateJson on Groq", () => {
  it("asks Qwen first, with a strict schema and no thinking", async () => {
    fakeNetwork({ "groq|qwen/qwen3.8-27b": [chatOk({ ok: true })] });
    const { generateJson } = await load({ GROQ_API_KEY: "gk" });

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(1);
    expect(calls[0].auth).toBe("Bearer gk");
    expect(calls[0].body).toMatchObject({
      model: "qwen/qwen3.8-27b",
      reasoning_effort: "none",
      response_format: { type: "json_schema", json_schema: { strict: true } },
    });
    // Strict mode lists every property as required and closes the object.
    const format = calls[0].body.response_format as { json_schema: { schema: Record<string, unknown> } };
    expect(format.json_schema.schema).toMatchObject({ required: ["ok", "note"], additionalProperties: false });
  });

  it("thinks when asked to", async () => {
    fakeNetwork({ "groq|qwen/qwen3.8-27b": [chatOk({ ok: true })] });
    const { generateJson } = await load({ GROQ_API_KEY: "gk" });
    await generateJson({ ...request, thinking: true });
    expect(calls[0].body).toMatchObject({ reasoning_effort: "default", reasoning_format: "hidden" });
  });

  it("moves to the next model when one is out of its daily allowance, and remembers", async () => {
    fakeNetwork({
      "groq|qwen/qwen3.8-27b": [chatError(429, "Rate limit reached ... on tokens per day (TPD)")],
      "groq|openai/gpt-oss-120b": [chatOk({ ok: 1 }), chatOk({ ok: 2 })],
    });
    const { generateJson } = await load({ GROQ_API_KEY: "gk" });

    await expect(generateJson(request)).resolves.toEqual({ ok: 1 });
    await expect(generateJson(request)).resolves.toEqual({ ok: 2 });
    // The second call did not waste a request on the exhausted model.
    expect(calls.map((c) => c.model)).toEqual([
      "qwen/qwen3.8-27b",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-120b",
    ]);
  });

  it("rotates to a second key when the first is rejected", async () => {
    fakeNetwork({ "groq|qwen/qwen3.8-27b": [chatError(401, "bad key"), chatOk({ ok: true })] });
    const { generateJson } = await load({ GROQ_API_KEY: "one, two" });

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls.map((c) => c.auth).sort()).toEqual(["Bearer one", "Bearer two"]);
  });

  it("steps down to JSON mode when the schema is refused, and drops rejected reasoning fields", async () => {
    fakeNetwork({
      "groq|qwen/qwen3.8-27b": [
        chatError(400, "unsupported parameter: reasoning_effort"),
        chatError(400, "response_format json_schema is not supported"),
        chatOk({ ok: true }),
      ],
    });
    const { generateJson } = await load({ GROQ_API_KEY: "gk" });

    await expect(generateJson(request)).resolves.toEqual({ ok: true });
    expect(calls).toHaveLength(3);
    expect(calls[2].body.response_format).toEqual({ type: "json_object" });
    expect(calls[2].body).not.toHaveProperty("reasoning_effort");
    // Without a schema in the request, the prompt carries it.
    expect(JSON.stringify(calls[2].body.messages)).toContain("JSON schema");
  });

  it("reads through <think> blocks and code fences", async () => {
    fakeNetwork({
      "groq|qwen/qwen3.8-27b": [
        chatOk(null, '<think>hmm {"no": 1}</think>\n```json\n{"ok": true}\n```'),
      ],
    });
    const { generateJson } = await load({ GROQ_API_KEY: "gk" });
    await expect(generateJson(request)).resolves.toEqual({ ok: true });
  });
});

describe("falling back across providers", () => {
  it("lands on Cerebras when every Groq model is spent", async () => {
    const spent = () => [chatError(429, "Rate limit on requests per day (RPD)")];
    fakeNetwork({
      "groq|qwen/qwen3.8-27b": spent(),
      "groq|openai/gpt-oss-120b": spent(),
      "groq|openai/gpt-oss-20b": spent(),
      "cerebras|qwen-3.8-27b": [chatOk({ ok: "cerebras" })],
    });
    const { generateJson } = await load({ GROQ_API_KEY: "gk", CEREBRAS_API_KEY: "ck" });

    await expect(generateJson(request)).resolves.toEqual({ ok: "cerebras" });
    expect(calls.at(-1)?.auth).toBe("Bearer ck");
  });

  it("ends on Gemini, and says so honestly when nothing answers", async () => {
    const busy = () => [chatError(503, "overloaded")];
    fakeNetwork({
      "groq|qwen/qwen3.8-27b": busy(),
      "groq|openai/gpt-oss-120b": busy(),
      "groq|openai/gpt-oss-20b": busy(),
      "gemini|gemini-3.8-flash": [geminiOk({ ok: "gemini" })],
    });
    const { generateJson } = await load({ GROQ_API_KEY: "gk", GEMINI_API_KEY: "g" });
    await expect(generateJson(request)).resolves.toEqual({ ok: "gemini" });

    fakeNetwork({
      "groq|qwen/qwen3.8-27b": busy(),
      "groq|openai/gpt-oss-120b": busy(),
      "groq|openai/gpt-oss-20b": busy(),
    });
    const only = await load({ GROQ_API_KEY: "gk" });
    await expect(only.generateJson(request)).rejects.toMatchObject({ status: 503 });
  });

  it("sends a recording to Gemini only, and refuses without a Gemini key", async () => {
    fakeNetwork({ "gemini|gemini-3.8-flash": [geminiOk({ ok: true })] });
    const withGemini = await load({ GROQ_API_KEY: "gk", GEMINI_API_KEY: "g" });
    const audio = { mimeType: "audio/webm", data: "AAAA" };
    await withGemini.generateJson({ ...request, messages: [{ role: "user", text: "x", audio }] });
    expect(calls.every((c) => c.url.includes("generativelanguage"))).toBe(true);

    fakeNetwork({});
    const groqOnly = await load({ GROQ_API_KEY: "gk" });
    await expect(
      groqOnly.generateJson({ ...request, messages: [{ role: "user", text: "x", audio }] }),
    ).rejects.toMatchObject({ status: 503 });
    expect(calls).toHaveLength(0);
  });
});

describe("toJsonSchema", () => {
  it("converts Gemini-style types, nullability and enums", async () => {
    vi.resetModules();
    const { toJsonSchema } = await import("@/lib/ai/openai-compat");
    expect(
      toJsonSchema(
        {
          type: "OBJECT",
          properties: {
            level: { type: "STRING", enum: ["a", "b"] },
            n: { type: "INTEGER", nullable: true },
            list: { type: "ARRAY", items: { type: "STRING" } },
          },
          required: ["level"],
        },
        false,
      ),
    ).toEqual({
      type: "object",
      properties: {
        level: { type: "string", enum: ["a", "b"] },
        n: { type: ["integer", "null"] },
        list: { type: "array", items: { type: "string" } },
      },
      required: ["level"],
      additionalProperties: false,
    });
  });
});
