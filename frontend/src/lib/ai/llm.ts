import "server-only";

import { env } from "@/lib/env.server";
import { HttpError } from "@/lib/http-error";
import {
  candidateModels,
  generateJson as generateJsonGemini,
  GeminiError,
  probeModels,
  type GeminiMessage,
  type GeminiSchema,
} from "@/lib/ai/gemini";
import {
  compatConfigured,
  compatProvider,
  generateJsonCompat,
  isCompatProvider,
  probeCompat,
  type CompatProbe,
  type CompatProviderName,
} from "@/lib/ai/openai-compat";

/**
 * The one entry point every AI feature uses. Which model answers is a
 * deployment setting, not something the features know about:
 *
 *   AI_PROVIDER=groq,cerebras,gemini   tried in this order, each falling back to the next
 *   AI_PROVIDER=gemini                 Gemini only
 *   AI_PROVIDER=mock                   canned answers, for development without a key
 *   (unset)                            every provider that has a key, in the order above
 *
 * A provider named in AI_PROVIDER but without a key is skipped, so the order
 * can be written down once and keys added as they are obtained.
 */

export type ProviderName = CompatProviderName | "gemini";

/** The order used when AI_PROVIDER is not set. */
const DEFAULT_ORDER: ProviderName[] = ["groq", "cerebras", "openrouter", "gemini"];

function isProviderName(name: string): name is ProviderName {
  return name === "gemini" || isCompatProvider(name);
}

function requestedTokens(): string[] {
  return env.AI_PROVIDER.split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

/** Whether AI calls should return canned answers instead of calling a model. */
export function isMockAi(): boolean {
  return requestedTokens().includes("mock");
}

function hasKey(provider: ProviderName): boolean {
  return provider === "gemini" ? Boolean(env.GEMINI_API_KEY) : compatConfigured(provider);
}

/** Providers to try, in order, that actually have a key. */
export function configuredProviders(): ProviderName[] {
  const named = requestedTokens().filter(isProviderName);
  const order = named.length > 0 ? named : DEFAULT_ORDER;
  return Array.from(new Set(order)).filter(hasKey);
}

const NOT_CONFIGURED_MESSAGE =
  "AI features are not set up on this server yet (no AI provider key is set).";

/**
 * Fails fast when no AI backend is configured — checked before a request is
 * counted against the user's allowance, so a misconfigured server does not
 * also use up everyone's daily limit.
 */
export function assertAiAvailable(): void {
  if (!isMockAi() && configuredProviders().length === 0) {
    throw new HttpError(503, NOT_CONFIGURED_MESSAGE);
  }
}

/** Whether a student's recording can be understood: only Gemini takes audio. */
export function audioAvailable(): boolean {
  return isMockAi() || Boolean(env.GEMINI_API_KEY);
}

export interface GenerateJsonOptions {
  system: string;
  messages: GeminiMessage[];
  temperature: number;
  schema?: GeminiSchema;
  /** Defaults to 8192; long structured replies (essay reviews) need more. */
  maxOutputTokens?: number;
  /**
   * Try the lightest models first. For short, simple replies: on Gemini it
   * saves the stronger models' small quota for essay reviews. The other
   * providers ignore it — their models have allowances of their own.
   */
  preferLite?: boolean;
  /** Let a reasoning model think first: for judgements, not for chat. */
  thinking?: boolean;
  relaxedSafety?: boolean;
  /** Overrides of the overall time budget and of each model call's timeout. */
  budgetMs?: number;
  attemptTimeoutMs?: number;
}

/** Everything one student request may spend across all providers. */
const TOTAL_BUDGET_MS = 85_000;
/** A fallback provider with less time left than this is not worth trying. */
const MIN_PROVIDER_MS = 6_000;

/**
 * Sends a conversation to the first provider that can answer and returns
 * the parsed JSON object. Throws `GeminiError`s (whatever the provider)
 * whose messages are safe to show a student.
 */
export async function generateJson(options: GenerateJsonOptions): Promise<unknown> {
  const hasAudio = options.messages.some((message) => message.audio);
  // Spoken turns go to Gemini as audio; no other free provider listens.
  const chain = hasAudio ? configuredProviders().filter((p) => p === "gemini") : configuredProviders();
  if (chain.length === 0) {
    throw new HttpError(
      503,
      hasAudio ? "Voice is not available on this server yet (it needs a Gemini key)." : NOT_CONFIGURED_MESSAGE,
    );
  }

  const deadline = Date.now() + (options.budgetMs ?? TOTAL_BUDGET_MS);
  let failure: GeminiError | null = null;

  for (const provider of chain) {
    const remaining = deadline - Date.now();
    if (failure && remaining < MIN_PROVIDER_MS) break;

    try {
      if (provider === "gemini") {
        return await generateJsonGemini({ ...options, budgetMs: Math.max(remaining, MIN_PROVIDER_MS) });
      }
      return await generateJsonCompat(provider, { ...options, budgetMs: Math.max(remaining, MIN_PROVIDER_MS) });
    } catch (error) {
      // Only provider trouble moves on to the next one; anything else is a bug.
      if (!(error instanceof GeminiError)) throw error;
      console.error(`[ai] ${provider} failed, ${chain.indexOf(provider) < chain.length - 1 ? "trying the next provider" : "no providers left"}: ${error.upstream}`);
      // Keep the most useful message: a busy-right-now beats a quota-gone.
      if (!failure || error.status !== 429 || failure.status === 429) failure = error;
    }
  }

  throw failure ?? new HttpError(503, NOT_CONFIGURED_MESSAGE);
}

export interface AiProbe {
  provider: ProviderName;
  model: string;
  ok: boolean;
  detail: string | null;
}

/** A one-word request to every model of every configured provider. */
export async function probeAi(): Promise<AiProbe[]> {
  const providers = configuredProviders();
  const results = await Promise.all(
    providers.map(async (provider): Promise<AiProbe[]> => {
      if (provider === "gemini") {
        return (await probeModels()).map((probe) => ({ provider, ...probe }));
      }
      return (await probeCompat(provider)).map((probe: CompatProbe) => ({
        provider,
        model: probe.model,
        ok: probe.ok,
        detail: probe.detail,
      }));
    }),
  );
  return results.flat();
}

/** What the admin status page and the health check report about the AI setup. No secrets. */
export function aiStatus() {
  const providers = configuredProviders();
  return {
    provider: env.AI_PROVIDER || "auto",
    order: providers,
    apiKeySet: providers.length > 0,
    configuredModel: env.GEMINI_MODEL ?? env.GROQ_MODEL ?? null,
    modelsTried: providers.flatMap((provider) =>
      (provider === "gemini" ? candidateModels() : compatProvider(provider).models()).map(
        (model) => `${provider}:${model}`,
      ),
    ),
  };
}
