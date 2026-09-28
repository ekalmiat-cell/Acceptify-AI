/**
 * The essay training course: five short units, one per writing skill the
 * rubric rewards, each a handful of two-minute drills. All of it is checked
 * instantly by plain rules (lib/training/check.ts) — the AI coach is an
 * optional extra, so the course costs nothing to run.
 *
 * The weak examples and model answers are written for this course, not taken
 * from anyone's real essay. Pure data; shared by the server and the UI.
 */

import type { CriterionKey } from "@/lib/essay-rubric";

export type UnitKey = "hook" | "specificity" | "reflection" | "voice" | "concise";

export interface Unit {
  key: UnitKey;
  title: string;
  /** The rubric criterion this unit trains, for "train your weakest". */
  criterion: CriterionKey;
  /** The one idea behind the unit, shown above every drill in it. */
  lesson: string;
}

/** A plain-rule check a rewrite must pass. */
export type Rule =
  | { type: "maxWords"; n: number }
  | { type: "minWords"; n: number }
  | { type: "maxSentences"; n: number }
  | { type: "noCliches" }
  | { type: "noFillers" }
  | { type: "noPassive" }
  /** None of these words or phrases (matched as word starts, any case). */
  | { type: "avoid"; words: string[]; label: string }
  /** At least one of these (a regular expression source, any case). */
  | { type: "include"; pattern: string; label: string; hint: string }
  /** A number, a time, a quote or a name — something a reader can picture. */
  | { type: "concrete" }
  /** Something a reader could see, hear, smell, taste or touch. */
  | { type: "sensory" }
  /** A capitalised name somewhere after the first word. */
  | { type: "name" }
  /** Mentions no more than `max` of these (for "pick one thing"). */
  | { type: "atMostOf"; words: string[]; max: number; label: string }
  /** Really rewritten, not the original with a word swapped. */
  | { type: "rewritten" };

export interface ChoiceOption {
  text: string;
  correct: boolean;
  why: string;
}

interface DrillBase {
  id: string;
  unit: UnitKey;
  title: string;
  /** What to do, in one or two sentences. */
  task: string;
  /** The weak text the drill starts from. */
  source?: string;
  /** One strong answer, and why it works. */
  model: string;
  modelWhy: string;
}

export interface RewriteDrill extends DrillBase {
  kind: "rewrite";
  rules: Rule[];
  placeholder: string;
}

export interface ChoiceDrill extends DrillBase {
  kind: "choose";
  options: ChoiceOption[];
}

export type Drill = RewriteDrill | ChoiceDrill;

export const UNITS: Unit[] = [
  {
    key: "hook",
    title: "Hook",
    criterion: "structure",
    lesson:
      "Readers decide in one sentence whether to lean in. Skip the warm-up and the big statement about life — open inside a moment only you could describe.",
  },
  {
    key: "specificity",
    title: "Specific story",
    criterion: "specificity",
    lesson:
      "Don't tell the reader what you are (\"hardworking\", \"curious\") — show a moment that proves it. Numbers, names, times and small physical details do the convincing.",
  },
  {
    key: "reflection",
    title: "Reflection",
    criterion: "reflection",
    lesson:
      "The story is half the essay; what you understood is the other half. Climb the ladder: what happened → what you understood → what you do differently now.",
  },
  {
    key: "voice",
    title: "Voice",
    criterion: "voice",
    lesson:
      "Admissions readers want to meet a person, not a thesaurus. Write the way you'd tell the story to a friend you respect — plain words, your own rhythm.",
  },
  {
    key: "concise",
    title: "Concise language",
    criterion: "language",
    lesson:
      "Every word should earn its place. Cut fillers, say who did what, and merge sentences that repeat themselves — then the good parts stand out.",
  },
];

export const DRILLS: Drill[] = [
  // ── Hook ────────────────────────────────────────────────────────────────
  {
    id: "hook-opener",
    unit: "hook",
    kind: "rewrite",
    title: "Replace the cliché opener",
    task: "This opening line could start ten thousand essays. Rewrite it so it starts inside one real moment.",
    source: "Ever since I was a child, I have always been passionate about medicine.",
    placeholder: "The first time I held a needle...",
    rules: [
      { type: "noCliches" },
      { type: "avoid", words: ["passionate", "ever since", "always"], label: "announcing a passion" },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 40 },
      { type: "rewritten" },
    ],
    model:
      "The first time I held a suture needle, it was on a banana, and my stitches looked like a zipper someone had given up on.",
    modelWhy:
      "It never says \"passionate\" — practising stitches on a banana at home proves it, and the funny image makes the reader want the next sentence.",
  },
  {
    id: "hook-mid-scene",
    unit: "hook",
    kind: "rewrite",
    title: "Start in the middle",
    task: "Don't announce the story — drop the reader straight into its most tense second. One or two sentences.",
    source:
      "In this essay I will tell you about the time I organized a charity fair at my school, which taught me a lot.",
    placeholder: "Forty minutes before the fair opened...",
    rules: [
      { type: "avoid", words: ["in this essay", "I will tell", "taught me"], label: "announcing the essay" },
      { type: "concrete" },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 45 },
    ],
    model: "Forty minutes before the charity fair opened, the only extension cord in School No. 12 started to smoke.",
    modelWhy:
      "A countdown, a place and a problem: the reader is already worried with you, and nothing was explained.",
  },
  {
    id: "hook-pick",
    unit: "hook",
    kind: "choose",
    title: "Pick the opening that pulls",
    task: "Which first sentence would make a tired admissions reader keep going?",
    options: [
      {
        text: "Webster's dictionary defines leadership as \"the action of leading a group of people.\"",
        correct: false,
        why: "Dictionary openings are one of the most common clichés, and they say nothing about you.",
      },
      {
        text: "I have always been a very hard-working and responsible person.",
        correct: false,
        why: "A claim anyone could make. The reader has no reason to believe it — or to keep reading.",
      },
      {
        text: "My grandmother keeps her savings in a pickle jar labelled \"Not pickles.\"",
        correct: true,
        why: "A specific, surprising image from real life. It raises a question the reader wants answered.",
      },
      {
        text: "Since the dawn of time, humans have always wanted to learn.",
        correct: false,
        why: "A giant statement about humanity is the opposite of personal — and readers see it constantly.",
      },
    ],
    model: "My grandmother keeps her savings in a pickle jar labelled \"Not pickles.\"",
    modelWhy: "Small, strange and true beats big and general every time.",
  },
  {
    id: "hook-cut-warmup",
    unit: "hook",
    kind: "rewrite",
    title: "Cut the warm-up",
    task: "The first sentences just clear their throat. Keep only what earns the opening — 30 words at most.",
    source:
      "Many people have hobbies. Some people like sports, and some people like music. For me, it has always been chess. Chess is a game that requires a lot of thinking. Last March, I lost a tournament game in eleven moves to a nine-year-old.",
    placeholder: "Last March, I lost...",
    rules: [
      { type: "avoid", words: ["many people", "some people", "always been"], label: "warm-up lines" },
      { type: "concrete" },
      { type: "maxWords", n: 30 },
    ],
    model: "Last March, I lost a tournament game in eleven moves to a nine-year-old. He shook my hand without looking up from his juice box.",
    modelWhy:
      "The real hook was hiding in the fifth sentence. Moving it to the front — and adding one detail — does all the work.",
  },

  // ── Specific story ──────────────────────────────────────────────────────
  {
    id: "spec-show",
    unit: "specificity",
    kind: "rewrite",
    title: "Show, don't tell",
    task: "This sentence tells the reader what to think. Rewrite it as a small scene they can picture, in 1–3 sentences.",
    source: "I am a very hardworking and passionate person who never gives up.",
    placeholder: "At 6 a.m. the gym was still dark when I...",
    rules: [
      {
        type: "avoid",
        words: ["hardworking", "hard-working", "passionate", "never give", "dedicated", "determined"],
        label: "telling adjectives",
      },
      { type: "noCliches" },
      { type: "concrete" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "By the fortieth failed run of our robot's turning code, my sister had gone to bed. I rewrote the loop at 1:12 a.m., and at 1:40 the robot finally rolled around the chair leg.",
    modelWhy:
      "Numbers, a time, a person and an action prove \"hardworking\" without ever saying it.",
  },
  {
    id: "spec-number",
    unit: "specificity",
    kind: "rewrite",
    title: "Swap vague for a number",
    task: "\"A lot\" and \"really hard\" are invisible. Replace them with numbers and details that show how much.",
    source: "I spent a lot of time practicing the piano, and it was really hard.",
    placeholder: "For 41 days...",
    rules: [
      { type: "include", pattern: "\\d|\\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred)\\b", label: "Has a number", hint: "Add a number: how many hours, days or tries?" },
      { type: "avoid", words: ["a lot", "really hard"], label: "vague amounts" },
      { type: "noFillers" },
      { type: "maxWords", n: 50 },
    ],
    model:
      "I practised the same eight bars of Chopin for 41 days, two hours before school, until my neighbour started humming them through the wall.",
    modelWhy: "\"41 days\" and the neighbour humming make the effort real — and a little funny.",
  },
  {
    id: "spec-senses",
    unit: "specificity",
    kind: "rewrite",
    title: "Add something a reader could sense",
    task: "\"Busy\" and \"interesting\" show nothing. Describe the place through what you saw, heard or smelled.",
    source: "The market was busy and interesting.",
    placeholder: "At the bazaar, a man...",
    rules: [
      { type: "sensory" },
      { type: "avoid", words: ["busy", "interesting"], label: "empty adjectives" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 60 },
    ],
    model:
      "At the Green Bazaar, a man sliced sausage with a knife as long as my forearm while a speaker two stalls over played the same pop song for the third time.",
    modelWhy: "A sight (the knife) and a sound (the looping song) put the reader in the market.",
  },
  {
    id: "spec-name",
    unit: "specificity",
    kind: "rewrite",
    title: "Name the person",
    task: "\"Someone\" is nobody. Name the person and show one thing they actually did.",
    source: "Someone at my school helped me a lot with physics.",
    placeholder: "Mr. ... stayed after the last bell and...",
    rules: [
      { type: "name" },
      { type: "avoid", words: ["someone", "helped me a lot"], label: "vague wording" },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 50 },
    ],
    model:
      "Every Thursday after the last bell, Mr. Seitkali made me explain Newton's third law to a room of empty chairs until I could do it without notes.",
    modelWhy: "A name, a day and one strange, specific habit tell us more than \"helped a lot\" ever could.",
  },
  {
    id: "spec-list-to-scene",
    unit: "specificity",
    kind: "rewrite",
    title: "Turn a list into one scene",
    task: "A list of titles is a résumé, not a story. Pick ONE of these and show a single moment from it.",
    source:
      "I was president of the debate club, captain of the volleyball team, a volunteer at an animal shelter, and a winner of the regional math olympiad.",
    placeholder: "Pick one — debate, volleyball, the shelter or the olympiad...",
    rules: [
      { type: "atMostOf", words: ["debate", "volleyball", "shelter", "olympiad"], max: 1, label: "Focuses on one thing" },
      { type: "concrete" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "At the shelter, a grey dog named Bars bit my sleeve on my first Tuesday. By March he slept with his head on my shoe while I filled in the feeding chart.",
    modelWhy: "One place, one animal, two moments months apart — the change tells the story the list couldn't.",
  },

  // ── Reflection ──────────────────────────────────────────────────────────
  {
    id: "refl-ladder",
    unit: "reflection",
    kind: "rewrite",
    title: "Climb the reflection ladder",
    task: "Here is the story. Write 2–3 sentences of reflection: what you understood, and what you do differently now.",
    source:
      "During my first week volunteering at the shelter, a dog named Bars bit my sleeve. I kept coming back, and by March he slept with his head on my shoe.",
    placeholder: "I used to think... Now I...",
    rules: [
      { type: "include", pattern: "\\b(realis|realiz|understood|understand|noticed|thought|believed|used to)", label: "Names what you understood", hint: "Say what you understood or used to believe." },
      { type: "include", pattern: "\\b(now|today|since then|these days|still)\\b", label: "Says what you do differently now", hint: "Add what you do differently now." },
      { type: "noCliches" },
      { type: "avoid", words: ["never give up", "valuable lesson", "taught me the importance"], label: "stock morals" },
      { type: "maxSentences", n: 3 },
    ],
    model:
      "I used to think trust was earned by being nice. Bars showed me it's earned by being predictable — showing up at 4 p.m. every Tuesday even when nothing happens. Now, when a younger student in my robotics club goes quiet, I don't push; I just keep showing up.",
    modelWhy:
      "Old belief → new understanding → a real behaviour today. Each rung is specific, and it grows out of the story.",
  },
  {
    id: "refl-generic",
    unit: "reflection",
    kind: "rewrite",
    title: "Replace the generic lesson",
    task: "Every reader has seen this moral. Write what YOU actually learned — something only your story could teach.",
    source: "This experience taught me to never give up and that hard work pays off.",
    placeholder: "What surprised me was...",
    rules: [
      { type: "noCliches" },
      { type: "avoid", words: ["never give up", "hard work", "taught me"], label: "stock morals" },
      { type: "rewritten" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "What surprised me was that the fix never came from trying harder. It came on the day I finally asked the eleventh-grader I'd been too proud to ask.",
    modelWhy: "A precise, slightly uncomfortable insight — far more believable than a poster slogan.",
  },
  {
    id: "refl-connect",
    unit: "reflection",
    kind: "rewrite",
    title: "Connect the lesson to the story",
    task: "The moral floats away from the story. Write a reflection that grows out of it — mention something from the story itself.",
    source:
      "Story: I rebuilt my grandfather's broken radio using YouTube tutorials and parts from a flea market.\nEnding: This showed me that I want to change the world.",
    placeholder: "Holding the radio...",
    rules: [
      { type: "include", pattern: "radio|grandfather|grandpa|flea market|parts|tutorial|solder|wire", label: "Links back to the story", hint: "Mention something from the story — the radio, your grandfather, the parts." },
      { type: "avoid", words: ["change the world", "make the world a better place", "make a difference"], label: "a giant claim" },
      { type: "noCliches" },
      { type: "maxSentences", n: 3 },
    ],
    model:
      "When the radio crackled into my grandfather's old station, I realised that most \"broken\" things are just things nobody has opened yet. I now keep a box of flea-market parts under my bed and take apart one thing a month.",
    modelWhy: "The insight comes straight from the radio, and the habit at the end proves it stuck.",
  },
  {
    id: "refl-pick",
    unit: "reflection",
    kind: "choose",
    title: "Spot real insight",
    task: "Which ending shows genuine reflection rather than a slogan?",
    options: [
      {
        text: "This experience made me who I am today.",
        correct: false,
        why: "It says something changed but never says what. Readers see this line constantly.",
      },
      {
        text: "I learned that teamwork makes the dream work.",
        correct: false,
        why: "A slogan, not a thought. It could close any essay about any team.",
      },
      {
        text: "I still flinch when someone says \"just wing it\" — but now I write the plan on the back of my hand first.",
        correct: true,
        why: "Honest (the flinch), specific (the hand) and shows a real, lasting change in behaviour.",
      },
      {
        text: "In conclusion, it was a valuable lesson that I will never forget.",
        correct: false,
        why: "\"In conclusion\" belongs in school reports, and the lesson itself is never named.",
      },
    ],
    model: "I still flinch when someone says \"just wing it\" — but now I write the plan on the back of my hand first.",
    modelWhy: "Reflection is a change you can see, not a label for one.",
  },

  // ── Voice ───────────────────────────────────────────────────────────────
  {
    id: "voice-thesaurus",
    unit: "voice",
    kind: "rewrite",
    title: "Un-thesaurus it",
    task: "Nobody talks like this. Say the same thing in plain words a real 17-year-old would use.",
    source:
      "Utilizing my multifaceted proclivities, I endeavored to ameliorate the pedagogical milieu of my institution.",
    placeholder: "I wanted our school to...",
    rules: [
      {
        type: "avoid",
        words: ["utiliz", "multifaceted", "proclivit", "endeavo", "ameliorat", "pedagogic", "milieu", "institution"],
        label: "thesaurus words",
      },
      { type: "maxWords", n: 35 },
      { type: "minWords", n: 6 },
    ],
    model: "I wanted our school to teach better, so I started a Friday club where students explain hard topics to each other.",
    modelWhy: "Plain words make the actual idea visible — and it turns out to be a good one.",
  },
  {
    id: "voice-friend",
    unit: "voice",
    kind: "rewrite",
    title: "Tell it to a friend",
    task: "This sounds like a report. Say what really happened the way you'd tell a friend — one or two sentences.",
    source:
      "Participation in the robotics competition was a profoundly transformative experience that significantly enhanced my collaborative capabilities.",
    placeholder: "At the robotics finals...",
    rules: [
      {
        type: "avoid",
        words: ["profound", "transformative", "significantly", "enhanc", "capabilit", "participation"],
        label: "report words",
      },
      { type: "noPassive" },
      { type: "concrete" },
      { type: "maxSentences", n: 2 },
    ],
    model:
      "At the robotics finals our arm dropped the ball three times, and I finally stopped trying to fix everything myself and let Dana rewrite the grip code.",
    modelWhy: "It's what actually happened, told simply — and it shows teamwork instead of claiming it.",
  },
  {
    id: "voice-pick",
    unit: "voice",
    kind: "choose",
    title: "Which one sounds like a person?",
    task: "Pick the sentence with a real, distinct voice.",
    options: [
      {
        text: "My passion for mathematics has been an integral part of my academic journey.",
        correct: false,
        why: "Could be written by anyone — or by a template. No person is visible behind it.",
      },
      {
        text: "I am a highly motivated individual with excellent communication skills.",
        correct: false,
        why: "This is a CV line, not an essay voice.",
      },
      {
        text: "I trust numbers more than people, which is a problem when you're the class treasurer.",
        correct: true,
        why: "Honest, a bit self-mocking and specific — you can hear a real person.",
      },
    ],
    model: "I trust numbers more than people, which is a problem when you're the class treasurer.",
    modelWhy: "Voice is honesty plus a detail only you would notice.",
  },

  // ── Concise language ────────────────────────────────────────────────────
  {
    id: "concise-80",
    unit: "concise",
    kind: "rewrite",
    title: "Cut it to 80 words",
    task: "Keep the story, lose the padding. Get this paragraph down to 80 words or fewer.",
    source:
      "Basically, when I first started working at my uncle's small car repair shop during the summer holidays, I honestly did not really know anything at all about cars or engines or anything like that. At first, I was only allowed to sweep the floors and bring tea to the customers who were waiting. However, after a few weeks of watching very carefully, my uncle finally let me change the oil on an old white Lada by myself, and I was extremely proud of myself because it was the first time that I had ever actually fixed something that was real and that people actually needed to use every day.",
    placeholder: "The summer I started at my uncle's garage...",
    rules: [
      { type: "maxWords", n: 80 },
      { type: "minWords", n: 35 },
      { type: "noFillers" },
      { type: "include", pattern: "lada|oil|uncle|shop|garage", label: "Keeps the story", hint: "Keep the core of the story — your uncle's shop and the oil change." },
    ],
    model:
      "The summer I started at my uncle's garage, I knew nothing about engines. For three weeks I swept floors and carried tea to waiting customers. Then my uncle handed me a wrench and pointed at an old white Lada. Changing that oil myself was the first time I'd fixed something real — something a family would drive to work the next morning.",
    modelWhy: "Fillers and repeats are gone; every sentence moves the story forward, and it ends on an image.",
  },
  {
    id: "concise-fillers",
    unit: "concise",
    kind: "rewrite",
    title: "Kill the fillers",
    task: "Stacked intensifiers make a sentence weaker, not stronger. Show the nerves in 18 words or fewer.",
    source:
      "Basically, I was really very nervous, and it was literally the most extremely stressful day of my whole entire life.",
    placeholder: "My hands shook so hard...",
    rules: [
      { type: "noFillers" },
      { type: "avoid", words: ["whole entire", "most stressful", "nervous"], label: "telling words" },
      { type: "maxWords", n: 18 },
    ],
    model: "My hands shook so hard I couldn't unzip my violin case.",
    modelWhy: "One physical detail shows the nerves better than five intensifiers.",
  },
  {
    id: "concise-passive",
    unit: "concise",
    kind: "rewrite",
    title: "Say who did it",
    task: "Passive voice hides the people. Rewrite so the actors come first — 25 words at most.",
    source: "The decision was made by our team to rebuild the project, and a new plan was written by me in two nights.",
    placeholder: "Our team decided...",
    rules: [{ type: "noPassive" }, { type: "maxWords", n: 25 }, { type: "rewritten" }],
    model: "Our team decided to start over, and I wrote the new plan in two nights.",
    modelWhy: "Active verbs are shorter, clearer — and put you in the story.",
  },
  {
    id: "concise-merge",
    unit: "concise",
    kind: "rewrite",
    title: "Merge the repeats",
    task: "Five choppy sentences repeat themselves. Merge them into one or two, 30 words at most.",
    source:
      "I joined the school newspaper. I joined it in ninth grade. At the newspaper I wrote articles. The articles were about school problems. One article was about the broken heating.",
    placeholder: "In ninth grade I joined...",
    rules: [
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 30 },
      { type: "include", pattern: "heating", label: "Keeps the key detail", hint: "Keep the broken heating — it's the most specific detail." },
    ],
    model: "In ninth grade I joined the school newspaper and wrote about what was broken — starting with the heating in Room 214.",
    modelWhy: "One sentence, no repeats, and a sharper detail at the end.",
  },
];

export function findUnit(key: UnitKey): Unit {
  return UNITS.find((unit) => unit.key === key) ?? UNITS[0];
}

export function findDrill(id: string): Drill | null {
  return DRILLS.find((drill) => drill.id === id) ?? null;
}

export function drillsInUnit(key: UnitKey): Drill[] {
  return DRILLS.filter((drill) => drill.unit === key);
}

/** The drill after this one in the course, or null at the very end. */
export function nextDrill(id: string, completed: ReadonlySet<string> = new Set()): Drill | null {
  const at = DRILLS.findIndex((drill) => drill.id === id);
  const after = [...DRILLS.slice(at + 1), ...DRILLS.slice(0, Math.max(0, at))];
  return after.find((drill) => !completed.has(drill.id)) ?? null;
}

/** Units in the order to study them: the student's weakest criterion first. */
export function orderedUnits(weakest: CriterionKey | null): Unit[] {
  if (!weakest) return UNITS;
  const first = UNITS.filter((unit) => unit.criterion === weakest);
  return [...first, ...UNITS.filter((unit) => unit.criterion !== weakest)];
}
