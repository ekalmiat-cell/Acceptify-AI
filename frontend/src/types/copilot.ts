export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export type CopilotMode = "text" | "voice";
export type CopilotStyle = "friendly" | "strict" | "uncensored";

export interface CopilotChatRequest {
  messages: ChatMessage[];
  include_context?: boolean;
  mode?: CopilotMode;
  lang?: "ru" | "en";
  style?: CopilotStyle;
}

export interface CopilotChatResponse {
  reply: string;
  suggested_followups: string[];
  /** Turns of this mode the student has left today (absent from mock replies in tests). */
  left?: number;
  /** Spoken replies only: lets the speech route read this reply aloud. */
  speech_token?: string;
}

export interface CopilotAllowance {
  text_left: number;
  voice_left: number;
  /** The day's voice turns for this user (the admin gets more). */
  voice_total?: number;
}
