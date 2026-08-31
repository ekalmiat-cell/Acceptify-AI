export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CopilotChatRequest {
  messages: ChatMessage[];
  include_context?: boolean;
}

export interface CopilotChatResponse {
  reply: string;
  suggested_followups: string[];
}
