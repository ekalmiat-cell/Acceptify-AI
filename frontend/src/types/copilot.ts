export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type CopilotMode = "text" | "voice";

export interface CopilotChatRequest {
  messages: ChatMessage[];
  include_context?: boolean;
  mode?: CopilotMode;
}

export interface CopilotChatResponse {
  reply: string;
  suggested_followups: string[];
  /** Turns of this mode the student has left today (absent from mock replies in tests). */
  left?: number;
}

export interface CopilotAllowance {
  text_left: number;
  voice_left: number;
}
