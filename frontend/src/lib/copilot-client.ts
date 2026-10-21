"use client";

import { apiFetch } from "@/lib/api-client";
import type {
  ChatMessage,
  CopilotAllowance,
  CopilotAudio,
  CopilotChatResponse,
  CopilotLang,
  CopilotMode,
  CopilotStyle,
} from "@/types/copilot";

/** The server gives up on Gemini after 40 s at most; this leaves room for the round trip. */
const CHAT_TIMEOUT_MS = 60_000;

/** Sends the conversation so far to the admissions copilot and returns its reply. */
export async function sendCopilotMessage(
  messages: ChatMessage[],
  includeContext: boolean = true,
  mode: CopilotMode = "text",
  lang?: CopilotLang,
  style: CopilotStyle = "friendly",
  /** Voice only: the recorded turn, so the reply follows the language actually spoken. */
  audio?: CopilotAudio,
): Promise<CopilotChatResponse> {
  return apiFetch<CopilotChatResponse>("/api/v1/copilot/chat", {
    method: "POST",
    body: JSON.stringify({
      messages,
      include_context: includeContext,
      mode,
      lang,
      style,
      audio,
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  });
}

/** How many typed and spoken turns the student has left today. */
export async function getCopilotAllowance(): Promise<CopilotAllowance> {
  return apiFetch<CopilotAllowance>("/api/v1/copilot/chat");
}
