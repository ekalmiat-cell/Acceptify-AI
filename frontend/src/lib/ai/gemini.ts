import "server-only";

import { env } from "@/lib/env.server";
import { HttpError } from "@/lib/http-error";

/**
 * A minimal client for Gemini's REST `generateContent` endpoint, in JSON
 * mode. No SDK: one POST is all the app needs, and this keeps full control
 * over timeouts and how failures are reported to the student.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const REQUEST_TIMEOUT_MS = 45_000;

export interface GeminiMessage {
  role: "user" | "model";
  text: string;
}

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
 * Sends a conversation to Gemini and returns the parsed JSON object it
 * replies with. Throws `HttpError`s whose messages are safe to show a user.
 */
export async function generateJson(options: {
  system: string;
  messages: GeminiMessage[];
  temperature: number;
}): Promise<unknown> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new HttpError(503, NOT_CONFIGURED_MESSAGE);

  let response: Response;
  try {
    response = await fetch(`${GEMINI_ENDPOINT}/${env.GEMINI_MODEL}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // In a header rather than `?key=` so it never lands in request logs.
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: options.system }] },
        contents: options.messages.map((message) => ({
          role: message.role,
          parts: [{ text: message.text }],
        })),
        generationConfig: {
          temperature: options.temperature,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new HttpError(504, "The AI took too long to answer. Please try again.");
    }
    console.error("[gemini] network error", error);
    throw new HttpError(502, "Couldn't reach the AI service. Please try again.");
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error(`[gemini] ${response.status} from ${env.GEMINI_MODEL}: ${body.slice(0, 500)}`);

    if (response.status === 429) {
      throw new HttpError(
        429,
        "The AI is handling too many requests right now. Please wait a minute and try again.",
      );
    }
    if (response.status === 400 && body.includes("API_KEY")) {
      throw new HttpError(503, "The AI service is misconfigured (invalid GEMINI_API_KEY).");
    }
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new HttpError(503, "The AI service is misconfigured (check GEMINI_API_KEY and GEMINI_MODEL).");
    }
    throw new HttpError(502, "The AI service returned an error. Please try again.");
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new HttpError(422, "The AI declined to process this text. Try rephrasing it.");
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("");
  if (!text) {
    throw new HttpError(502, "The AI returned an empty answer. Please try again.");
  }

  try {
    return JSON.parse(stripCodeFence(text));
  } catch {
    console.error("[gemini] reply was not JSON:", text.slice(0, 500));
    throw new HttpError(502, "The AI returned an answer we couldn't read. Please try again.");
  }
}

/** JSON mode normally returns bare JSON, but tolerate a ```json fence. */
export function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return match ? match[1] : trimmed;
}
