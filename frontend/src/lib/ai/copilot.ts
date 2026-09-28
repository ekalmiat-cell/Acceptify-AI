import "server-only";

import { z } from "zod";

import { generateJson, isMockAi, type GeminiMessage, type GeminiSchema } from "@/lib/ai/gemini";
import { HttpError } from "@/lib/http-error";
import type { ChatMessage, CopilotChatResponse } from "@/types/copilot";

const SYSTEM_PROMPT = `You are Acceptify AI Copilot — an empathetic, brilliant, and proactive AI admissions mentor and college counselor embedded in the Acceptify AI platform.

Your mission is to guide the student toward admission to their dream universities with strategic, actionable, encouraging, and highly specific advice.

### Guidelines for Your Answers:
1. **Personalized Context:** If the student's profile (GPA, SAT, IELTS, ENT, achievements, target universities) is provided in the system context, actively reference it to provide hyper-relevant guidance.
2. **Actionable & Realistic:** Break complex admissions steps into clear, manageable tasks (e.g. essay ideas, test retake strategies, extracurricular project expansion).
3. **Structured & Beautiful Formatting:** Use bullet points, bold headers, and concise paragraphs for high readability.
4. **Tone:** Warm, intelligent, motivating, and realistic (no false guarantees, focus on true competitive strategy).
5. **Multilingual:** Answer fluently in the same language the student asks (Russian, Kazakh, or English). In Russian, address the student informally with "ты", like the rest of the site.
6. **Suggest Next Questions:** At the end of your response, always provide 2-3 brief, relevant follow-up questions the student might want to explore next.
7. **Stay on topic:** You help with university admissions, studying abroad, tests, essays, scholarships and related planning. Politely decline unrelated requests.

### Output JSON Format:
You must output a valid JSON object with the following structure:
{
  "reply": "Your markdown-formatted response here...",
  "suggested_followups": [
    "Follow-up question 1",
    "Follow-up question 2"
  ]
}`;

/** The shape Gemini is constrained to produce. */
const REPLY_SCHEMA: GeminiSchema = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    suggested_followups: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["reply", "suggested_followups"],
  propertyOrdering: ["reply", "suggested_followups"],
};

const replySchema = z.object({
  reply: z.coerce.string().min(1),
  suggested_followups: z.array(z.coerce.string()).catch([]),
});

/** How much conversation is sent back to the model on each turn. */
const MAX_HISTORY_MESSAGES = 20;

/**
 * Shapes the browser's chat log into what Gemini accepts: a conversation that
 * opens with the user and alternates turns. The widget's own greeting (an
 * assistant message before the student said anything) is dropped, and
 * consecutive messages from the same side are merged.
 *
 * Only the student's and the copilot's own turns are forwarded. A "system"
 * role from the browser is treated as the student speaking — it must never be
 * able to act as an instruction from us.
 */
export function toGeminiHistory(messages: ChatMessage[]): GeminiMessage[] {
  const history: GeminiMessage[] = [];

  for (const message of messages) {
    const role = message.role === "assistant" ? "model" : "user";
    if (history.length === 0 && role === "model") continue;

    const previous = history[history.length - 1];
    if (previous?.role === role) {
      previous.text = `${previous.text}\n\n${message.content}`;
    } else {
      history.push({ role, text: message.content });
    }
  }

  return history;
}

export async function runCopilotChat(
  messages: ChatMessage[],
  studentContext: string | null,
): Promise<CopilotChatResponse> {
  if (isMockAi()) {
    return {
      reply:
        "**[Mock copilot — AI_PROVIDER=mock]** This is a placeholder answer for local development. Set `GEMINI_API_KEY` to talk to the real copilot.",
      suggested_followups: ["How do I balance my university list?", "How do I write a strong essay?"],
    };
  }

  const system = studentContext
    ? `${SYSTEM_PROMPT}\n\n### Current Student Context:\n${studentContext}`
    : SYSTEM_PROMPT;

  const history = toGeminiHistory(messages.slice(-MAX_HISTORY_MESSAGES));
  if (history.length === 0) {
    throw new HttpError(422, "Send a message to start the conversation.");
  }

  const raw = await generateJson({
    system,
    messages: history,
    temperature: 0.5,
    schema: REPLY_SCHEMA,
  });
  const parsed = replySchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(502, "The AI returned an answer we couldn't read. Please try again.");
  }
  return {
    reply: parsed.data.reply,
    suggested_followups: parsed.data.suggested_followups.slice(0, 3),
  };
}
