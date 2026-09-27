import "server-only";

import { env } from "@/lib/env.server";
import { HttpError } from "@/lib/http-error";

/**
 * A minimal client for Gemini's REST `generateContent` endpoint, in JSON
 * mode. No SDK: one POST is all the app needs, and this keeps full control
 * over timeouts, model fallback and how failures are reported.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
/** Longest a single model call may take. */
const REQUEST_TIMEOUT_MS = 55_000;
/** Everything one student request may spend on Gemini, across retries. */
const TOTAL_BUDGET_MS = 85_000;
/** A retry with less time left than this is not worth starting. */
const MIN_ATTEMPT_MS = 8_000;
/** Passes over the model list, and the base pause before each extra pass. */
const MAX_ROUNDS = 3;
const ROUND_PAUSE_MS = 1_500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Models tried in order when GEMINI_MODEL is not set, or when the configured
 * one is unavailable to this API key (retired, or not on its tier). All are
 * on Gemini's free tier, where each model has its own small daily quota
 * (about 20 requests), so the lighter models at the end keep the site
 * answering once the stronger ones are used up for the day.
 */
export const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
];

/**
 * Models whose daily free quota ran out, with when to try them again. A
 * per-instance memory: it only saves the wasted round trips, so an hour is
 * a safe guess even though Google resets the quota at midnight Pacific.
 */
const EXHAUSTED_FOR_MS = 60 * 60 * 1000;
const exhaustedUntil: Map<string, number> = ((
  globalThis as { __acceptifyGeminiExhausted?: Map<string, number> }
).__acceptifyGeminiExhausted ??= new Map());

function isDailyQuotaExhausted(status: number, body: string): boolean {
  return status === 429 && /PerDay/i.test(body);
}

export function candidateModels(): string[] {
  const configured = env.GEMINI_MODEL;
  return Array.from(new Set([...(configured ? [configured] : []), ...FALLBACK_MODELS]));
}

/** Candidates minus those known to be out of daily quota right now. */
function modelsWithQuota(): string[] {
  const now = Date.now();
  const all = candidateModels();
  const usable = all.filter((model) => (exhaustedUntil.get(model) ?? 0) <= now);
  // If every model is marked, try them all again rather than refuse outright.
  return usable.length ? usable : all;
}

export interface GeminiMessage {
  role: "user" | "model";
  text: string;
}

/**
 * Structured-output schema in Gemini's OpenAPI subset. Constraining the reply
 * this way is far more reliable than describing the JSON in the prompt alone.
 */
export type GeminiSchema =
  | { type: "STRING"; enum?: string[]; nullable?: boolean }
  | { type: "INTEGER" | "NUMBER" | "BOOLEAN"; nullable?: boolean }
  | { type: "ARRAY"; items: GeminiSchema }
  | {
      type: "OBJECT";
      properties: Record<string, GeminiSchema>;
      required?: string[];
      propertyOrdering?: string[];
      nullable?: boolean;
    };

/**
 * Whether AI calls should return canned responses instead of calling Gemini.
 * Only ever on when explicitly asked for — a missing API key is reported as a
 * configuration error, never papered over with fake answers.
 */
export function isMockAi(): boolean {
  return env.AI_PROVIDER === "mock";
}

const NOT_CONFIGURED_MESSAGE =
  "AI features are not set up on this server yet (GEMINI_API_KEY is missing).";

/**
 * Fails fast when no AI backend is configured — checked before a request is
 * counted against the user's allowance, so a misconfigured server does not
 * also use up everyone's hourly limit.
 */
export function assertAiAvailable(): void {
  if (!isMockAi() && !env.GEMINI_API_KEY) {
    throw new HttpError(503, NOT_CONFIGURED_MESSAGE);
  }
}

/**
 * A failed Gemini call. `message` is safe to show a student; `upstream` is
 * Google's own explanation, kept for the logs and the admin status page.
 */
export class GeminiError extends HttpError {
  readonly upstream: string;
  readonly model: string | null;

  constructor(status: number, message: string, upstream: string, model: string | null) {
    super(status, message);
    this.name = "GeminiError";
    this.upstream = upstream;
    this.model = model;
  }
}

/** Google's `{ error: { message, status } }` body, flattened to one line. */
function describeUpstream(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string; status?: string } };
    if (parsed.error?.message) {
      return `${status} ${parsed.error.status ?? ""}: ${parsed.error.message}`.trim();
    }
  } catch {
    // Not JSON — fall through to the raw text.
  }
  return `${status}: ${body.slice(0, 300)}`;
}

/**
 * Whether this model can never serve this key — unknown, retired, or not on
 * its tier (a quota of zero, "limit: 0").
 */
function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status === 400 && /not (found|supported)/i.test(body)) return true;
  if (status === 429 && /limit:\s*0\b/.test(body)) return true;
  return false;
}

/**
 * Whether the next model is worth trying. Besides unavailable models, that
 * covers rate limits — free-tier quotas are per model, so another model
 * usually still has room — and Google's "high demand" 5xx overloads, which
 * hit one model at a time.
 */
function shouldTryNextModel(status: number, body: string): boolean {
  return isModelUnavailable(status, body) || status === 429 || status >= 500;
}

function toUserFacingError(status: number, body: string, model: string): GeminiError {
  const upstream = describeUpstream(status, body);

  if (status === 429) {
    return new GeminiError(
      429,
      "The AI is handling too many requests right now. Please wait a minute and try again.",
      upstream,
      model,
    );
  }
  if ((status === 400 && /API[_ ]KEY/i.test(body)) || status === 401 || status === 403) {
    return new GeminiError(
      503,
      "The AI service is misconfigured: the GEMINI_API_KEY was rejected.",
      upstream,
      model,
    );
  }
  if (status === 400 && /location is not supported/i.test(body)) {
    return new GeminiError(
      503,
      "The AI service is not available from this server's region.",
      upstream,
      model,
    );
  }
  if (status >= 500) {
    return new GeminiError(
      503,
      "Google's AI is overloaded right now. Please try again in a minute.",
      upstream,
      model,
    );
  }
  return new GeminiError(502, "The AI service returned an error. Please try again.", upstream, model);
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string; thought?: boolean }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

async function callModel(
  model: string,
  apiKey: string,
  body: string,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<{ ok: true; data: GeminiResponse } | { ok: false; status: number; text: string }> {
  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // In a header rather than `?key=` so it never lands in request logs.
        "x-goog-api-key": apiKey,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new GeminiError(
        504,
        "The AI took too long to answer. Please try again.",
        `timeout after ${Math.round(timeoutMs / 1000)}s`,
        model,
      );
    }
    console.error("[gemini] network error", error);
    throw new GeminiError(
      502,
      "Couldn't reach the AI service. Please try again.",
      String(error),
      model,
    );
  }

  if (!response.ok) {
    return { ok: false, status: response.status, text: await response.text().catch(() => "") };
  }
  return { ok: true, data: (await response.json()) as GeminiResponse };
}

/**
 * Sends a conversation to Gemini and returns the parsed JSON object it
 * replies with, trying the next model when one is unavailable to this key.
 * Throws `GeminiError`s whose messages are safe to show a user.
 */
export async function generateJson(options: {
  system: string;
  messages: GeminiMessage[];
  temperature: number;
  schema?: GeminiSchema;
  /** Defaults to 8192; long structured replies (essay reviews) need more. */
  maxOutputTokens?: number;
}): Promise<unknown> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, NOT_CONFIGURED_MESSAGE);

  const buildBody = (withSchema: boolean) =>
    JSON.stringify({
      system_instruction: { parts: [{ text: options.system }] },
      contents: options.messages.map((message) => ({
        role: message.role,
        parts: [{ text: message.text }],
      })),
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens ?? 8192,
        responseMimeType: "application/json",
        ...(withSchema && options.schema ? { responseSchema: options.schema } : {}),
      },
    });

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let models = modelsWithQuota();
  let dailyQuotaHits = 0;
  let lastFailure: GeminiError | null = null;
  // Whether some model was merely busy or broken rather than unavailable —
  // then the student should hear that (e.g. "too busy"), not that no model
  // exists.
  let lastFailureWasTransient = false;
  const withSchema = new Map<string, boolean>();

  // Free-tier overloads come and go within seconds and hit models
  // independently, so go round all of them a few times with short pauses
  // before giving up — within one overall time budget.
  for (let round = 0; round < MAX_ROUNDS && models.length > 0; round++) {
    if (round > 0) {
      const pause = ROUND_PAUSE_MS * round;
      if (Date.now() + pause >= deadline) break;
      await sleep(pause);
    }

    const stillAvailable: string[] = [];

    for (const model of models) {
      const remaining = deadline - Date.now();
      if (remaining < MIN_ATTEMPT_MS) break;
      const timeout = Math.min(REQUEST_TIMEOUT_MS, remaining);

      const useSchema = withSchema.get(model) ?? true;
      let result = await callModel(model, apiKey, buildBody(useSchema), timeout);

      // A model that rejects the structured-output schema still answers
      // well with the JSON described in the prompt alone; retry without it.
      if (!result.ok && result.status === 400 && useSchema && options.schema && /schema/i.test(result.text)) {
        console.error(`[gemini] ${model} rejected the response schema: ${result.text.slice(0, 300)}`);
        withSchema.set(model, false);
        result = await callModel(model, apiKey, buildBody(false), timeout);
      }

      if (!result.ok) {
        console.error(`[gemini] ${model}: ${describeUpstream(result.status, result.text)}`);
        const failure = toUserFacingError(result.status, result.text, model);
        if (!shouldTryNextModel(result.status, result.text)) throw failure;

        // Out of today's quota: no use retrying it this round or the next.
        if (isDailyQuotaExhausted(result.status, result.text)) {
          exhaustedUntil.set(model, Date.now() + EXHAUSTED_FOR_MS);
          dailyQuotaHits++;
          lastFailure ??= failure;
          continue;
        }

        const transient = !isModelUnavailable(result.status, result.text);
        if (transient) stillAvailable.push(model);
        if (transient || !lastFailureWasTransient) {
          lastFailure = failure;
          lastFailureWasTransient = transient;
        }
        continue;
      }

      try {
        return parseReply(result.data, model);
      } catch (error) {
        // An empty or unreadable answer from one model: another may do better.
        if (!(error instanceof GeminiError) || error.status !== 502) throw error;
        stillAvailable.push(model);
        lastFailure = error;
        lastFailureWasTransient = true;
      }
    }

    // Models that can never serve this key are not worth another round.
    models = stillAvailable;
  }

  if (lastFailure && lastFailureWasTransient) throw lastFailure;

  if (dailyQuotaHits > 0) {
    throw new GeminiError(
      429,
      "Today's free AI allowance for the whole site is used up. It resets overnight — please try again tomorrow.",
      lastFailure?.upstream ?? "daily quota exhausted",
      lastFailure?.model ?? null,
    );
  }

  throw new GeminiError(
    503,
    "None of the configured AI models are available to this API key.",
    lastFailure?.upstream ?? "no models tried",
    lastFailure?.model ?? null,
  );
}

export interface ModelProbe {
  model: string;
  ok: boolean;
  /** Google's explanation when the call failed. */
  detail: string | null;
}

/**
 * Sends a one-word request to every candidate model and reports which ones
 * this API key can actually use — the admin status page's AI check.
 */
export async function probeModels(): Promise<ModelProbe[]> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: 'Reply with {"ok":true}' }] }],
    generationConfig: { responseMimeType: "application/json", maxOutputTokens: 256 },
  });

  return Promise.all(
    candidateModels().map(async (model): Promise<ModelProbe> => {
      try {
        const result = await callModel(model, apiKey, body);
        return result.ok
          ? { model, ok: true, detail: null }
          : { model, ok: false, detail: describeUpstream(result.status, result.text) };
      } catch (error) {
        return {
          model,
          ok: false,
          detail: error instanceof GeminiError ? error.upstream : String(error),
        };
      }
    }),
  );
}

function parseReply(data: GeminiResponse, model: string): unknown {
  if (data.promptFeedback?.blockReason) {
    throw new GeminiError(
      422,
      "The AI declined to process this text. Try rephrasing it.",
      `blocked: ${data.promptFeedback.blockReason}`,
      model,
    );
  }

  const candidate = data.candidates?.[0];
  // Thinking models may return their reasoning as separate "thought" parts;
  // only the answer parts are the JSON we asked for.
  const text = candidate?.content?.parts
    ?.filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("");

  if (!text) {
    throw new GeminiError(
      502,
      "The AI returned an empty answer. Please try again.",
      `empty reply (finishReason: ${candidate?.finishReason ?? "none"})`,
      model,
    );
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    console.error(`[gemini] ${model} reply was not JSON:`, text.slice(0, 500));
    throw new GeminiError(
      502,
      "The AI returned an answer we couldn't read. Please try again.",
      `unparseable reply (finishReason: ${candidate?.finishReason ?? "none"})`,
      model,
    );
  }
}

/** JSON mode normally returns bare JSON, but tolerate a ```json fence. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}
