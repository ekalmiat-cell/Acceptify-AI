"use client";

import { apiFetch } from "@/lib/api-client";
import type { ChatMessage, CopilotChatResponse } from "@/types/copilot";

/**
 * Sends conversation messages to the backend AI Admissions Copilot (powered by Gemini 3.7 Flash).
 */
export async function sendCopilotMessage(
  messages: ChatMessage[],
  includeContext: boolean = true
): Promise<CopilotChatResponse> {
  return apiFetch<CopilotChatResponse>("/api/v1/copilot/chat", {
    method: "POST",
    body: JSON.stringify({
      messages,
      include_context: includeContext,
    }),
  });
}
