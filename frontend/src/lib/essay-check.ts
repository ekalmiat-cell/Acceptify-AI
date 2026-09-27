/**
 * The instant, no-AI check that runs as a student types: overused phrases,
 * likely passive voice, filler words, sentence rhythm and concrete detail.
 * Plain rules, so it is free, private and immediate — and approximate, which
 * the UI says. Pure; shared by the editor and its tests.
 */

export type CheckKind = "cliche" | "passive" | "filler" | "specific";

export interface CheckIssue {
  start: number;
  end: number;
  kind: CheckKind;
  message: string;
}

export interface EssayCheck {
  words: number;
  sentences: number;
  paragraphs: number;
  issues: CheckIssue[];
  metrics: {
    cliches: number;
    passive: number;
    fillers: number;
    /** Sentences that open with "I". */
    iStarts: number;
    avgSentenceWords: number;
    variety: "low" | "ok" | "good";
    /** Sentences carrying concrete detail: numbers, names, quotes. */
    specifics: number;
  };
  /** Things worth fixing before spending an AI review. */
  quickFixes: number;
}

/** Phrases admissions readers see in thousands of essays. */
const CLICHES: { phrase: string; message?: string }[] = [
  { phrase: "ever since i was a child", message: "Overused opener. Start with the moment itself instead." },
  { phrase: "ever since i was young", message: "Overused opener. Start with the moment itself instead." },
  { phrase: "ever since i was little", message: "Overused opener. Start with the moment itself instead." },
  { phrase: "since i was a little", message: "Overused opener. Start with the moment itself instead." },
  { phrase: "from a young age" },
  { phrase: "i have always been passionate" },
  { phrase: "i've always been passionate" },
  { phrase: "i am passionate about", message: "Show the passion through what you did — don't announce it." },
  { phrase: "i have always wanted" },
  { phrase: "in today's society" },
  { phrase: "in today's world" },
  { phrase: "since the dawn of time" },
  { phrase: "throughout history" },
  { phrase: "defines as", message: "Dictionary-definition openings are a classic cliché." },
  { phrase: "according to the dictionary", message: "Dictionary-definition openings are a classic cliché." },
  { phrase: "made me who i am today" },
  { phrase: "who i am today" },
  { phrase: "comfort zone" },
  { phrase: "hard work pays off" },
  { phrase: "never give up" },
  { phrase: "opened my eyes" },
  { phrase: "changed my life" },
  { phrase: "life-changing" },
  { phrase: "at the end of the day" },
  { phrase: "make a difference" },
  { phrase: "make the world a better place" },
  { phrase: "follow my dreams" },
  { phrase: "follow my passion" },
  { phrase: "reach for the stars" },
  { phrase: "blood, sweat and tears" },
  { phrase: "everything happens for a reason" },
  { phrase: "the rest is history" },
  { phrase: "more alike than different" },
  { phrase: "a whole new world" },
  { phrase: "in conclusion", message: "Essays aren't school reports — end on an image or insight instead." },
  { phrase: "to sum up", message: "Essays aren't school reports — end on an image or insight instead." },
  { phrase: "last but not least" },
  { phrase: "the best version of myself" },
  { phrase: "step out of my" },
  { phrase: "a valuable lesson" },
  { phrase: "taught me the importance of" },
];

const CLICHE_MESSAGE =
  "Overused phrase — readers see it constantly. Replace it with your own words or a specific detail.";

const FILLER = /\b(very|really|extremely|basically|literally|incredibly|a lot of|stuff)\b/gi;

const PASSIVE =
  /\b(am|is|are|was|were|be|been|being)\s+(?:\w+ly\s+)?(\w+ed|built|done|given|made|taken|written|shown|seen|told|known|found|held|kept|lost|paid|said|sent|taught|thought|won|chosen|driven|broken|spoken|forgotten|begun|brought|bought|caught|felt|heard|led|meant|met|read|run|sold|understood)\b/gi;

/** Participles that are almost always adjectives ("was tired"), not passive. */
const ADJECTIVAL = new Set([
  "tired", "excited", "interested", "bored", "scared", "worried", "surprised", "amazed",
  "confused", "determined", "embarrassed", "exhausted", "frightened", "inspired", "motivated",
  "pleased", "relieved", "satisfied", "shocked", "stressed", "terrified", "thrilled", "used",
  "supposed", "based", "involved", "focused", "dedicated", "committed", "prepared", "qualified",
  "married", "concerned", "disappointed", "fascinated", "obsessed", "overwhelmed", "talented",
]);

export function checkEssay(text: string): EssayCheck {
  const issues: CheckIssue[] = [];
  const lower = text.toLowerCase().replace(/[’‘]/g, "'");

  let cliches = 0;
  for (const { phrase, message } of CLICHES) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(phrase, from);
      if (at === -1) break;
      if (!overlaps(issues, at, at + phrase.length)) {
        issues.push({ start: at, end: at + phrase.length, kind: "cliche", message: message ?? CLICHE_MESSAGE });
        cliches++;
      }
      from = at + phrase.length;
    }
  }

  let passive = 0;
  for (const match of text.matchAll(PASSIVE)) {
    const participle = match[2].toLowerCase();
    if (ADJECTIVAL.has(participle)) continue;
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(issues, start, end)) continue;
    issues.push({
      start,
      end,
      kind: "passive",
      message: "Possible passive voice. Say who did it: “my family decided”, not “it was decided”.",
    });
    passive++;
  }

  let fillers = 0;
  for (const match of text.matchAll(FILLER)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (overlaps(issues, start, end)) continue;
    issues.push({
      start,
      end,
      kind: "filler",
      message: "Filler word. Cut it, or replace it with something precise.",
    });
    fillers++;
  }

  const sentences = splitSentences(text);
  const lengths = sentences.map((s) => countWords(s.text));
  let iStarts = 0;
  let specifics = 0;
  for (const sentence of sentences) {
    if (/^["“'(]?I\b/.test(sentence.text.trimStart())) iStarts++;
    if (specificity(sentence.text) >= 2) {
      specifics++;
      if (!overlaps(issues, sentence.start, sentence.end)) {
        issues.push({
          start: sentence.start,
          end: sentence.end,
          kind: "specific",
          message: "Concrete detail — this is the kind of sentence readers remember.",
        });
      }
    }
  }

  const avg = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const deviation = lengths.length
    ? Math.sqrt(lengths.reduce((sum, n) => sum + (n - avg) ** 2, 0) / lengths.length)
    : 0;
  const variety = lengths.length < 3 ? "ok" : deviation < 4 ? "low" : deviation < 7 ? "ok" : "good";

  const tooManyIStarts = sentences.length >= 5 && iStarts / sentences.length > 0.35;
  const quickFixes = cliches + passive + (variety === "low" ? 1 : 0) + (tooManyIStarts ? 1 : 0);

  issues.sort((a, b) => a.start - b.start);
  return {
    words: countWords(text),
    sentences: sentences.length,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
    issues,
    metrics: {
      cliches,
      passive,
      fillers,
      iStarts,
      avgSentenceWords: Math.round(avg),
      variety,
      specifics,
    },
    quickFixes,
  };
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Sentences with their character offsets. */
export function splitSentences(text: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = [];
  const pattern = /[^.!?\n]+[.!?]*["”')\]]*/g;
  for (const match of text.matchAll(pattern)) {
    const raw = match[0];
    const lead = raw.length - raw.trimStart().length;
    const trimmed = raw.trim();
    if (countWords(trimmed) < 2) continue;
    const start = (match.index ?? 0) + lead;
    out.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return out;
}

/** Rough count of concrete markers: numbers, mid-sentence names, quotes. */
function specificity(sentence: string): number {
  let score = 0;
  if (/\d/.test(sentence) || /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred)\b/i.test(sentence)) score++;
  const words = sentence.split(/\s+/).slice(1);
  const names = words.filter((w) => /^[A-Z][a-z]{2,}/.test(w) && !/^(I|I'm|I've|I'd|I'll)$/.test(w));
  if (names.length >= 1) score++;
  if (names.length >= 2) score++;
  if (/["“”]/.test(sentence)) score++;
  return score;
}

function overlaps(issues: CheckIssue[], start: number, end: number): boolean {
  return issues.some((issue) => start < issue.end && end > issue.start);
}
