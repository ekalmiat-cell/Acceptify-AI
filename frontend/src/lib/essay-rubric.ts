/**
 * The essay rubric: what is scored, how much each part weighs, and how the
 * overall score is computed from the AI's per-criterion scores.
 *
 * The overall number is computed here, not by the model: a model asked for
 * "an overall score" drifts and inflates, while a weighted sum of anchored
 * criteria plus hard caps is stable and explainable ("no clear answer to the
 * question → at most 60"). Pure, shared by the server and the UI.
 */

export const CRITERIA = [
  {
    key: "reflection",
    label: "Reflection and insight",
    short: "Reflection",
    weight: 25,
    measures: "What the writer understood about themselves — the 'so what' of the story.",
    anchors: {
      high: "Insight is specific, earned by the story, and shows maturity or a genuine change in thinking.",
      mid: "Reflection is present but generic ('I learned never to give up') or tacked on at the end.",
      low: "Little or no reflection; the essay recounts events without saying what they meant.",
    },
  },
  {
    key: "specificity",
    label: "Specific story and detail",
    short: "Specific story",
    weight: 20,
    measures: "Concrete scenes, actions, numbers and names that show rather than tell.",
    anchors: {
      high: "Vivid, particular scenes a reader remembers; claims are shown through actions and detail.",
      mid: "Some real specifics mixed with summary and abstract claims.",
      low: "Mostly abstract statements or a list of achievements; nothing a reader could picture.",
    },
  },
  {
    key: "voice",
    label: "Voice and authenticity",
    short: "Voice",
    weight: 15,
    measures: "Whether it sounds like a real, thoughtful teenager — distinct, honest, not performed.",
    anchors: {
      high: "A distinct personal voice; honest, natural, could only have been written by this person.",
      mid: "Pleasant but generic; parts sound formal, borrowed or written to impress.",
      low: "Stiff, thesaurus-heavy, or reads like a template or AI-generated text.",
    },
  },
  {
    key: "structure",
    label: "Structure and flow",
    short: "Structure",
    weight: 15,
    measures: "A clear arc: an opening that pulls in, paragraphs that build, an ending that lands.",
    anchors: {
      high: "Compelling opening, purposeful paragraphs, smooth transitions, a resonant ending.",
      mid: "Understandable arc with a slow start, a sagging middle, or a flat ending.",
      low: "Disorganised; ideas jump around or the essay has no clear shape.",
    },
  },
  {
    key: "prompt",
    label: "Answers the question",
    short: "Answers question",
    weight: 15,
    measures: "Whether every part of the essay question is answered directly.",
    anchors: {
      high: "Answers every part of the question directly and memorably.",
      mid: "Answers the question partly or indirectly; one part is missing or thin.",
      low: "Drifts from the question or does not really answer it.",
    },
  },
  {
    key: "language",
    label: "Language and mechanics",
    short: "Language",
    weight: 10,
    measures: "Grammar, clarity and concision of the English.",
    anchors: {
      high: "Clean, clear and concise; errors are rare and never distracting.",
      mid: "Mostly clear, with wordiness or errors that occasionally distract.",
      low: "Frequent errors or unclear sentences that get in the way of meaning.",
    },
  },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];

export const CRITERION_KEYS = CRITERIA.map((criterion) => criterion.key) as [
  CriterionKey,
  ...CriterionKey[],
];

/** Yes/no judgements that cap the overall score when they fail. */
export interface EssayFlags {
  answers_prompt: boolean;
  has_specific_story: boolean;
  has_reflection: boolean;
}

export interface ScoreCap {
  max: number;
  reason: string;
}

/**
 * Hard ceilings: however polished the prose, an essay that misses one of
 * these cannot be competitive, so the score says so.
 */
export function scoreCaps(flags: EssayFlags, hasPrompt: boolean): ScoreCap[] {
  const caps: ScoreCap[] = [];
  if (hasPrompt && !flags.answers_prompt) {
    caps.push({ max: 60, reason: "It doesn't clearly answer the essay question." });
  }
  if (!flags.has_reflection) {
    caps.push({ max: 65, reason: "It doesn't say what you learned or how you changed." });
  }
  if (!flags.has_specific_story) {
    caps.push({ max: 70, reason: "It has no specific moment or story a reader can picture." });
  }
  return caps;
}

/** Weighted average of the criteria, then the lowest applicable cap. */
export function computeOverallScore(
  scores: Record<CriterionKey, number>,
  flags: EssayFlags,
  hasPrompt: boolean,
): { score: number; weighted: number; cap: ScoreCap | null } {
  const totalWeight = CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  const weighted = Math.round(
    CRITERIA.reduce((sum, c) => sum + clampScore(scores[c.key]) * c.weight, 0) / totalWeight,
  );

  const caps = scoreCaps(flags, hasPrompt).sort((a, b) => a.max - b.max);
  const cap = caps.find((c) => weighted > c.max) ?? null;
  return { score: cap ? cap.max : weighted, weighted, cap };
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.min(100, Math.max(0, value)));
}

export const READINESS = [
  { min: 90, label: "Ready to submit", tone: "success" },
  { min: 80, label: "Strong — polish it", tone: "success" },
  { min: 65, label: "Solid draft", tone: "brand" },
  { min: 50, label: "Needs revision", tone: "warning" },
  { min: 0, label: "Early draft", tone: "danger" },
] as const;

export function readinessFor(score: number): (typeof READINESS)[number] {
  return READINESS.find((band) => score >= band.min) ?? READINESS[READINESS.length - 1];
}
