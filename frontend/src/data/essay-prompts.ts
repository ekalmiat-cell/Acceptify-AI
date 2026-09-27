/**
 * Essay questions a student can write against. The Common App texts are the
 * published 2025–26 prompts; the others are the common shapes of
 * university-specific questions. `wordLimit` drives the length meter.
 */
export interface EssayPrompt {
  id: string;
  group: "Common App" | "University-specific";
  label: string;
  text: string;
  wordLimit: number | null;
}

export const ESSAY_PROMPTS: EssayPrompt[] = [
  {
    id: "ca-1",
    group: "Common App",
    label: "Background, identity or talent",
    text: "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.",
    wordLimit: 650,
  },
  {
    id: "ca-2",
    group: "Common App",
    label: "Challenge or setback",
    text: "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?",
    wordLimit: 650,
  },
  {
    id: "ca-3",
    group: "Common App",
    label: "Questioning a belief",
    text: "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    wordLimit: 650,
  },
  {
    id: "ca-4",
    group: "Common App",
    label: "Gratitude",
    text: "Reflect on something that someone has done for you that has made you happy or thankful in a surprising way. How has this gratitude affected or motivated you?",
    wordLimit: 650,
  },
  {
    id: "ca-5",
    group: "Common App",
    label: "Personal growth",
    text: "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    wordLimit: 650,
  },
  {
    id: "ca-6",
    group: "Common App",
    label: "An idea you lose time in",
    text: "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you? What or who do you turn to when you want to learn more?",
    wordLimit: 650,
  },
  {
    id: "ca-7",
    group: "Common App",
    label: "Topic of your choice",
    text: "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
    wordLimit: 650,
  },
  {
    id: "why-us",
    group: "University-specific",
    label: "Why this university",
    text: "Why are you interested in this university, and how will its specific programmes, people and community help you reach your goals?",
    wordLimit: 300,
  },
  {
    id: "motivation",
    group: "University-specific",
    label: "Motivation letter",
    text: "Write a motivation letter explaining why you want to study your chosen programme at this university, what has prepared you for it, and what you hope to achieve.",
    wordLimit: 600,
  },
];

/** The id used when the student types their own question. */
export const CUSTOM_PROMPT_ID = "custom";

export function findPrompt(id: string | null): EssayPrompt | null {
  return ESSAY_PROMPTS.find((prompt) => prompt.id === id) ?? null;
}
