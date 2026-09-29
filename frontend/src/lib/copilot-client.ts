"use client";

import { apiFetch } from "@/lib/api-client";
import type { ChatMessage, CopilotAllowance, CopilotChatResponse, CopilotMode } from "@/types/copilot";

const CHAT_TIMEOUT_MS = 100_000;

/** Sends the conversation so far to the admissions copilot and returns its reply. */
export async function sendCopilotMessage(
  messages: ChatMessage[],
  includeContext: boolean = true,
  mode: CopilotMode = "text",
): Promise<CopilotChatResponse> {
  return apiFetch<CopilotChatResponse>("/api/v1/copilot/chat", {
    method: "POST",
    body: JSON.stringify({
      messages,
      include_context: includeContext,
      mode,
    }),
    signal: AbortSignal.timeout(CHAT_TIMEOUT_MS),
  });
}

/** How many typed and spoken turns the student has left today. */
export async function getCopilotAllowance(): Promise<CopilotAllowance> {
  return apiFetch<CopilotAllowance>("/api/v1/copilot/chat");
}
