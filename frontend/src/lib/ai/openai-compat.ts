import "server-only";

import { env } from "@/lib/env.server";
import {
  GeminiError,
  stripCodeFence,
  type GeminiMessage,
  type GeminiSchema,
} from "@/lib/ai/gemini";

/**
 * A client for the free providers that speak OpenAI's `chat/completions`
 * dialect — Groq, Cerebras, OpenRouter. One POST per attempt, no SDK, same
 * contract as the Gemini client: JSON in, parsed JSON out, `GeminiError`s
 * whose messages are safe to show a student.
 *
 * Free tiers are small and per model, so a provider here is a list of models
 * and a list of keys; a model or key that is out of quota is skipped for a
 * while and the next one answers.
 */

export type CompatProviderName = "groq" | "cerebras" | "openrouter";

interface CompatProvider {
  name: CompatProviderName;
  label: string;
  url: string;
  /** Keys from the environment; one variable may hold several, comma-separated. */
  keys: () => string[];
  /** The configured model first, then these defaults. */
  models: () => string[];
  /** Name of the output-length field this provider documents. */
  maxTokensField: "max_completion_tokens" | "max_tokens";
  /** Provider-specific request fields for one model (reasoning controls). */
  extras: (model: string, thinking: boolean) => Record<string, unknown>;
  headers?: Record<string, string>;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * GPT-OSS only understands low/medium/high effort. Qwen3.x on Groq is a
 * hybrid model: "none" switches thinking off (fast, cheap in tokens), and
 * "hidden" keeps the reasoning out of the answer when it is on.
 */
function groqExtras(model: string, thinking: boolean): Record<string, unknown> {
  if (model.includes("gpt-oss")) return { reasoning_effort: thinking ? "medium" : "low" };
  if (model.includes("qwen")) {
    return thinking
      ? { reasoning_effort: "default", reasoning_format: "hidden" }
      : { reasoning_effort: "none" };
  }
  return {};
}

function cerebrasExtras(model: string, thinking: boolean): Record<string, unknown> {
  if (model.includes("gpt-oss")) return { reasoning_effort: thinking ? "medium" : "low" };
  return {};
}

const PROVIDERS: Record<CompatProviderName, CompatProvider> = {
  groq: {
    name: "groq",
    label: "Groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    keys: () => splitList(env.GROQ_API_KEY),
    // Qwen first: the best Russian/English of the free models, strict JSON
    // schemas, and its own 1,000-requests-a-day allowance; the GPT-OSS pair
    // each bring another allowance of the same size.
    models: () => unique([...splitList(env.GROQ_MODEL), "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]),
    maxTokensField: "max_completion_tokens",
    extras: groqExtras,
  },
  cerebras: {
    name: "cerebras",
    label: "Cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    keys: () => splitList(env.CEREBRAS_API_KEY),
    models: () => unique([...splitList(env.CEREBRAS_MODEL), "qwen-3.8-27b", "gpt-oss-120b"]),
    maxTokensField: "max_completion_tokens",
    extras: cerebrasExtras,
  },
  openrouter: {
    name: "openrouter",
    label: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    keys: () => splitList(env.OPENROUTER_API_KEY),
    // OpenRouter's free catalog rotates, so there is no fixed default list:
    // "openrouter/free" lets it pick whichever free model is up.
    models: () => unique([...splitList(env.OPENROUTER_MODEL), "openrouter/free"]),
    maxTokensField: "max_tokens",
    extras: () => ({}),
    headers: { "HTTP-Referer": "https://acceptify.ai", "X-Title": "Acceptify AI" },
  },
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

export function compatProvider(name: CompatProviderName): CompatProvider {
  return PROVIDERS[name];
}

export function isCompatProvider(name: string): name is CompatProviderName {
  return name in PROVIDERS;
}

export function compatConfigured(name: CompatProviderName): boolean {
  return PROVIDERS[name].keys().length > 0;
}

/**
 * Model + key pairs that hit a limit, with when to try them again. A
 * per-instance memory that only saves wasted round trips; the provider stays
 * the authority.
 */
const cooldowns: Map<string, number> = ((
  globalThis as { __acceptifyCompatCooldowns?: Map<string, number> }
).__acceptifyCompatCooldowns ??= new Map());
let rotation = 0;

const DAILY_COOLDOWN_MS = 60 * 60 * 1000;
const MIN_COOLDOWN_MS = 5_000;
const MAX_COOLDOWN_MS = 60_000;
/** Time a single attempt may take; the caller's budget can shorten it. */
const ATTEMPT_TIMEOUT_MS = 30_000;
/** A retry with less time left than this is not worth starting. */
const MIN_ATTEMPT_MS = 4_000;

function cooldownKey(provider: CompatProviderName, model: string, key: string): string {
  return `${provider}|${model}|${key.slice(-6)}`;
}

/** JSON Schema (draft-07 subset) from the Gemini-style schema the callers write. */
export function toJsonSchema(schema: GeminiSchema, strict: boolean): Record<string, unknown> {
  const withNull = (type: string, nullable?: boolean) => (nullable ? [type, "null"] : type);

  switch (schema.type) {
    case "STRING":
      return {
        type: withNull("string", schema.nullable),
        ...(schema.enum ? { enum: schema.nullable ? [...schema.enum, null] : schema.enum } : {}),
      };
    case "INTEGER":
      return { type: withNull("integer", schema.nullable) };
    case "NUMBER":
      return { type: withNull("number", schema.nullable) };
    case "BOOLEAN":
      return { type: withNull("boolean", schema.nullable) };
    case "ARRAY":
      return { type: withNull("array", undefined), items: toJsonSchema(schema.items, strict) };
    case "OBJECT": {
      const keys = Object.keys(schema.properties);
      return {
        type: withNull("object", schema.nullable),
        properties: Object.fromEntries(keys.map((key) => [key, toJsonSchema(schema.properties[key], strict)])),
        // Strict mode wants every property listed as required.
        required: strict ? keys : (schema.required ?? []),
        additionalProperties: false,
      };
    }
  }
}

type ResponseMode = "schema" | "object";

interface ChatCompletion {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  error?: { message?: string };
}

function describeUpstream(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; code?: string } | string };
    const error = parsed.error;
    if (typeof error === "string") return `${status}: ${error}`;
    if (error?.message) return `${status} ${error.code ?? ""}: ${error.message}`.trim();
  } catch {
    // Not JSON — fall through.
  }
  return `${status}: ${body.slice(0, 300)}`;
}

function keyRejectedMessage(provider: CompatProvider): string {
  return `The AI service is misconfigured: the ${provider.label} API key was rejected.`;
}

/**
 * Whether this model can never serve this key (retired, or not on its tier)
 * — it is skipped for the rest of the call, and for an hour after.
 */
function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  return status === 400 && /(model|does not exist).{0,60}(not found|not supported|does not exist|decommissioned)/i.test(body);
}

function isDailyLimit(body: string): boolean {
  return /per day|\(TPD\)|\(RPD\)|daily|free-models-per-day/i.test(body);
}

function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(seconds) || seconds <= 0) return MIN_COOLDOWN_MS;
  return Math.min(MAX_COOLDOWN_MS, Math.max(MIN_COOLDOWN_MS, seconds * 1000));
}

interface AttemptSettings {
  mode: ResponseMode;
  extras: boolean;
}

type AttemptResult =
  | { ok: true; data: ChatCompletion }
  | { ok: false; status: number; text: string; retryAfter: number };

async function post(
  provider: CompatProvider,
  model: string,
  key: string,
  options: GenerateOptions,
  settings: AttemptSettings,
  timeoutMs: number,
): Promise<AttemptResult> {
  const schemaForPrompt = options.schema ? toJsonSchema(options.schema, false) : null;
  // Without a schema in the request the model only knows the shape from the
  // prompt; say it once more, in terms it follows well.
  const system =
    settings.mode === "object" && schemaForPrompt
      ? `${options.system}\n\nReply with ONE JSON object and nothing else. It must match this JSON schema:\n${JSON.stringify(schemaForPrompt)}`
      : options.system;

  const body = {
    model,
    messages: [
      { role: "system", content: system },
      ...options.messages.map((message) => ({
        role: message.role === "model" ? "assistant" : "user",
        content: message.text,
      })),
    ],
    temperature: options.temperature,
    [provider.maxTokensField]: options.maxOutputTokens ?? 8192,
    response_format:
      settings.mode === "schema" && options.schema
        ? {
            type: "json_schema",
            json_schema: { name: "reply", strict: true, schema: toJsonSchema(options.schema, true) },
          }
        : { type: "json_object" },
    ...(settings.extras ? provider.extras(model, options.thinking ?? false) : {}),
  };

  let response: Response;
  try {
    response = await fetch(provider.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        ...provider.headers,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new GeminiError(
        504,
        "The AI took too long to answer. Please try again.",
        `${provider.name}: timeout after ${Math.round(timeoutMs / 1000)}s`,
        model,
      );
    }
    console.error(`[${provider.name}] network error`, error);
    throw new GeminiError(502, "Couldn't reach the AI service. Please try again.", String(error), model);
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      text: await response.text().catch(() => ""),
      retryAfter: retryAfterMs(response),
    };
  }
  return { ok: true, data: (await response.json()) as ChatCompletion };
}

/** Reasoning models may leave a `<think>` block in the content. */
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

function parseReply(data: ChatCompletion, provider: CompatProvider, model: string): unknown {
  const choice = data.choices?.[0];
  const text = stripThinking(choice?.message?.content ?? "");
  if (!text) {
    throw new GeminiError(
      502,
      "The AI returned an empty answer. Please try again.",
      `${provider.name}: empty reply (finish_reason: ${choice?.finish_reason ?? "none"})`,
      model,
    );
  }
  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    // Some models wrap the object in a sentence; take the outermost braces.
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        // fall through
      }
    }
    console.error(`[${provider.name}] ${model} reply was not JSON:`, text.slice(0, 500));
    throw new GeminiError(
      502,
      "The AI returned an answer we couldn't read. Please try again.",
      `${provider.name}: unparseable reply (finish_reason: ${choice?.finish_reason ?? "none"})`,
      model,
    );
  }
}

export interface GenerateOptions {
  system: string;
  messages: GeminiMessage[];
  temperature: number;
  schema?: GeminiSchema;
  maxOutputTokens?: number;
  /** Let a reasoning model think before answering — slower and costs more tokens. */
  thinking?: boolean;
  budgetMs?: number;
  attemptTimeoutMs?: number;
}

/**
 * Sends the conversation to one provider and returns the parsed JSON reply,
 * walking its models and keys until one answers. Throws a `GeminiError` when
 * none can; the caller decides whether another provider gets a turn.
 */
export async function generateJsonCompat(
  name: CompatProviderName,
  options: GenerateOptions,
): Promise<unknown> {
  const provider = PROVIDERS[name];
  const keys = provider.keys();
  const deadline = Date.now() + (options.budgetMs ?? 55_000);
  const attemptTimeout = options.attemptTimeoutMs ?? ATTEMPT_TIMEOUT_MS;

  // Start each call on a different key so several keys share the load.
  const offset = rotation++;
  const rotated = keys.map((_, index) => keys[(index + offset) % keys.length]);
  const candidates = provider
    .models()
    .flatMap((model) => rotated.map((key) => ({ model, key })));

  const now = Date.now();
  let usable = candidates.filter((c) => (cooldowns.get(cooldownKey(name, c.model, c.key)) ?? 0) <= now);
  // Everything cooling down: better to try than to refuse outright.
  if (usable.length === 0) usable = candidates;

  let lastFailure: GeminiError | null = null;
  let sawDailyLimit = false;
  let sawTransient = false;
  const deadModels = new Set<string>();
  const rejectedKeys = new Set<string>();

  for (const { model, key } of usable) {
    if (deadModels.has(model) || rejectedKeys.has(key)) continue;
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;
    const timeout = Math.min(attemptTimeout, remaining);

    const settings: AttemptSettings = { mode: options.schema ? "schema" : "object", extras: true };

    // A 400 about the schema or about a reasoning field means "ask differently",
    // not "give up on this model": step down at most twice.
    for (let step = 0; step < 3; step++) {
      let result: AttemptResult;
      try {
        result = await post(provider, model, key, options, settings, timeout);
      } catch (error) {
        if (!(error instanceof GeminiError)) throw error;
        console.error(`[${name}] ${model}: ${error.upstream}`);
        lastFailure = error;
        sawTransient = true;
        break;
      }

      if (result.ok) {
        try {
          return parseReply(result.data, provider, model);
        } catch (error) {
          if (!(error instanceof GeminiError)) throw error;
          lastFailure = error;
          sawTransient = true;
          break;
        }
      }

      const upstream = describeUpstream(result.status, result.text);
      console.error(`[${name}] ${model}: ${upstream}`);

      if (result.status === 400) {
        if (settings.extras && /reasoning|unrecognized|unknown (request )?(field|param)|not supported|unsupported/i.test(result.text)) {
          settings.extras = false;
          continue;
        }
        if (settings.mode === "schema" && /schema|response_format|structured|json/i.test(result.text)) {
          settings.mode = "object";
          continue;
        }
      }

      if (result.status === 401 || result.status === 403) {
        rejectedKeys.add(key);
        lastFailure = new GeminiError(503, keyRejectedMessage(provider), upstream, model);
        break;
      }
      if (result.status === 429) {
        const daily = isDailyLimit(result.text);
        cooldowns.set(cooldownKey(name, model, key), Date.now() + (daily ? DAILY_COOLDOWN_MS : result.retryAfter));
        if (daily) sawDailyLimit = true;
        else sawTransient = true;
        lastFailure = new GeminiError(
          429,
          "The AI is handling too many requests right now. Please wait a minute and try again.",
          upstream,
          model,
        );
        break;
      }
      if (isModelUnavailable(result.status, result.text)) {
        deadModels.add(model);
        cooldowns.set(cooldownKey(name, model, key), Date.now() + DAILY_COOLDOWN_MS);
        lastFailure ??= new GeminiError(503, "None of the configured AI models are available to this API key.", upstream, model);
        break;
      }
      if (result.status >= 500 || result.status === 400 || result.status === 422) {
        // Overloaded, or the model produced output the schema rejected: another model may do better.
        sawTransient = true;
        lastFailure = new GeminiError(
          result.status >= 500 ? 503 : 502,
          result.status >= 500
            ? "The AI is overloaded right now. Please try again in a minute."
            : "The AI service returned an error. Please try again.",
          upstream,
          model,
        );
        break;
      }
      // Anything else (402, 413 …) will not get better on another model of the same provider.
      throw new GeminiError(502, "The AI service returned an error. Please try again.", upstream, model);
    }
  }

  if (lastFailure && sawTransient) throw lastFailure;
  if (sawDailyLimit) {
    throw new GeminiError(
      429,
      "Today's free AI allowance for the whole site is used up. It resets overnight — please try again tomorrow.",
      lastFailure?.upstream ?? `${name}: daily quota exhausted`,
      lastFailure?.model ?? null,
    );
  }
  throw (
    lastFailure ??
    new GeminiError(503, "None of the configured AI models are available to this API key.", `${name}: no models tried`, null)
  );
}

export interface CompatProbe {
  provider: CompatProviderName;
  model: string;
  ok: boolean;
  detail: string | null;
}

/** A one-word request to every model of a provider, with its first key. */
export async function probeCompat(name: CompatProviderName): Promise<CompatProbe[]> {
  const provider = PROVIDERS[name];
  const [key] = provider.keys();
  if (!key) return [];

  return Promise.all(
    provider.models().map(async (model): Promise<CompatProbe> => {
      try {
        const result = await post(
          provider,
          model,
          key,
          {
            system: "Reply with the JSON object {\"ok\":true}.",
            messages: [{ role: "user", text: "ping" }],
            temperature: 0,
            maxOutputTokens: 64,
          },
          { mode: "object", extras: true },
          15_000,
        );
        return result.ok
          ? { provider: name, model, ok: true, detail: null }
          : { provider: name, model, ok: false, detail: describeUpstream(result.status, result.text) };
      } catch (error) {
        return {
          provider: name,
          model,
          ok: false,
          detail: error instanceof GeminiError ? error.upstream : String(error),
        };
      }
    }),
  );
}
