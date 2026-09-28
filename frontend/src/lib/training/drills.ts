/**
 * The essay training course: five short units, one per writing skill the
 * rubric rewards, each a handful of two-minute drills. All of it is checked
 * instantly by plain rules (lib/training/check.ts) — the AI coach is an
 * optional extra, so the course costs nothing to run.
 *
 * Two kinds of text live here, and they never mix:
 * - instructions and explanations (`Localized`) — in the interface language;
 * - essay material (`source`, `model`, `placeholder`, option `text`) — always
 *   English, because the essays students write are in English.
 *
 * The weak examples and model answers are written for this course, not taken
 * from anyone's real essay. Pure data; shared by the server and the UI.
 */

import type { CriterionKey } from "@/lib/essay-rubric";
import type { Locale } from "@/lib/i18n/core";

/** Text shown in the interface language. */
export type Localized = Record<Locale, string>;

export type UnitKey = "hook" | "specificity" | "reflection" | "voice" | "concise";

export interface Unit {
  key: UnitKey;
  title: Localized;
  /** The rubric criterion this unit trains, for "train your weakest". */
  criterion: CriterionKey;
  /** The one idea behind the unit, shown above every drill in it. */
  lesson: Localized;
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
  | { type: "avoid"; words: string[]; label: Localized }
  /** At least one of these (a regular expression source, any case). */
  | { type: "include"; pattern: string; label: Localized; hint: Localized }
  /** A number, a time, a quote or a name — something a reader can picture. */
  | { type: "concrete" }
  /** Something a reader could see, hear, smell, taste or touch. */
  | { type: "sensory" }
  /** A capitalised name somewhere after the first word. */
  | { type: "name" }
  /** Mentions no more than `max` of these (for "pick one thing"). */
  | { type: "atMostOf"; words: string[]; max: number; label: Localized }
  /** Really rewritten, not the original with a word swapped. */
  | { type: "rewritten" };

export interface ChoiceOption {
  /** An essay sentence — English. */
  text: string;
  correct: boolean;
  why: Localized;
}

interface DrillBase {
  id: string;
  unit: UnitKey;
  title: Localized;
  /** What to do, in one or two sentences. */
  task: Localized;
  /** The weak text the drill starts from — English. */
  source?: string;
  /** One strong answer (English), and why it works. */
  model: string;
  modelWhy: Localized;
}

export interface RewriteDrill extends DrillBase {
  kind: "rewrite";
  rules: Rule[];
  /** How an answer might begin — English, like the answer. */
  placeholder: string;
}

export interface ChoiceDrill extends DrillBase {
  kind: "choose";
  options: ChoiceOption[];
}

export type Drill = RewriteDrill | ChoiceDrill;

const TELLING: Localized = { en: "telling adjectives", ru: "слова-ярлыки" };
const STOCK_MORALS: Localized = { en: "stock morals", ru: "шаблонные выводы" };

export const UNITS: Unit[] = [
  {
    key: "hook",
    title: { en: "Hook", ru: "Первая фраза" },
    criterion: "structure",
    lesson: {
      en: "Readers decide in one sentence whether to lean in. Skip the warm-up and the big statement about life — open inside a moment only you could describe.",
      ru: "Читатель за одно предложение решает, интересно ли ему. Пропусти разгон и громкие слова о жизни — начни с момента, который можешь описать только ты.",
    },
  },
  {
    key: "specificity",
    title: { en: "Specific story", ru: "Конкретика" },
    criterion: "specificity",
    lesson: {
      en: "Don't tell the reader what you are (\"hardworking\", \"curious\") — show a moment that proves it. Numbers, names, times and small physical details do the convincing.",
      ru: "Не называй свои качества («hardworking», «curious») — покажи момент, который их доказывает. Убеждают цифры, имена, время и мелкие детали, которые можно увидеть.",
    },
  },
  {
    key: "reflection",
    title: { en: "Reflection", ru: "Рефлексия" },
    criterion: "reflection",
    lesson: {
      en: "The story is half the essay; what you understood is the other half. Climb the ladder: what happened → what you understood → what you do differently now.",
      ru: "История — половина эссе, вторая половина — то, что тебе стало понятно. Поднимайся по лестнице: что случилось → что стало понятно → что я теперь делаю иначе.",
    },
  },
  {
    key: "voice",
    title: { en: "Voice", ru: "Свой голос" },
    criterion: "voice",
    lesson: {
      en: "Admissions readers want to meet a person, not a thesaurus. Write the way you'd tell the story to a friend you respect — plain words, your own rhythm.",
      ru: "Приёмная комиссия хочет познакомиться с человеком, а не со словарём синонимов. Пиши так, как рассказываешь историю другу, которого уважаешь: простые слова, свой ритм.",
    },
  },
  {
    key: "concise",
    title: { en: "Concise language", ru: "Лаконичность" },
    criterion: "language",
    lesson: {
      en: "Every word should earn its place. Cut fillers, say who did what, and merge sentences that repeat themselves — then the good parts stand out.",
      ru: "Каждое слово должно быть на своём месте. Убери слова-паразиты, называй, кто что сделал, объединяй повторяющиеся предложения — тогда сильные места будут заметны.",
    },
  },
];

export const DRILLS: Drill[] = [
  // ── Hook ────────────────────────────────────────────────────────────────
  {
    id: "hook-opener",
    unit: "hook",
    kind: "rewrite",
    title: { en: "Replace the cliché opener", ru: "Замени банальное начало" },
    task: {
      en: "This opening line could start ten thousand essays. Rewrite it so it starts inside one real moment.",
      ru: "С этой фразы могли бы начинаться десять тысяч эссе. Перепиши её так, чтобы она начиналась внутри одного реального момента.",
    },
    source: "Ever since I was a child, I have always been passionate about medicine.",
    placeholder: "The first time I held a needle...",
    rules: [
      { type: "noCliches" },
      {
        type: "avoid",
        words: ["passionate", "ever since", "always"],
        label: { en: "announcing a passion", ru: "объявление о страсти" },
      },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 40 },
      { type: "rewritten" },
    ],
    model:
      "The first time I held a suture needle, it was on a banana, and my stitches looked like a zipper someone had given up on.",
    modelWhy: {
      en: "It never says \"passionate\" — practising stitches on a banana at home proves it, and the funny image makes the reader want the next sentence.",
      ru: "Здесь нет слова «passionate» — страсть доказывают швы на банане дома, а смешной образ заставляет читать дальше.",
    },
  },
  {
    id: "hook-mid-scene",
    unit: "hook",
    kind: "rewrite",
    title: { en: "Start in the middle", ru: "Начни с середины" },
    task: {
      en: "Don't announce the story — drop the reader straight into its most tense second. One or two sentences.",
      ru: "Не объявляй историю — сразу брось читателя в самую напряжённую секунду. Одно-два предложения.",
    },
    source:
      "In this essay I will tell you about the time I organized a charity fair at my school, which taught me a lot.",
    placeholder: "Forty minutes before the fair opened...",
    rules: [
      {
        type: "avoid",
        words: ["in this essay", "I will tell", "taught me"],
        label: { en: "announcing the essay", ru: "объявление темы эссе" },
      },
      { type: "concrete" },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 45 },
    ],
    model: "Forty minutes before the charity fair opened, the only extension cord in School No. 12 started to smoke.",
    modelWhy: {
      en: "A countdown, a place and a problem: the reader is already worried with you, and nothing was explained.",
      ru: "Обратный отсчёт, место и проблема: читатель уже волнуется вместе с тобой, хотя ничего не объяснено.",
    },
  },
  {
    id: "hook-pick",
    unit: "hook",
    kind: "choose",
    title: { en: "Pick the opening that pulls", ru: "Выбери цепляющее начало" },
    task: {
      en: "Which first sentence would make a tired admissions reader keep going?",
      ru: "После какой первой фразы уставший сотрудник приёмной комиссии захочет читать дальше?",
    },
    options: [
      {
        text: "Webster's dictionary defines leadership as \"the action of leading a group of people.\"",
        correct: false,
        why: {
          en: "Dictionary openings are one of the most common clichés, and they say nothing about you.",
          ru: "Начало со словарного определения — одно из самых частых клише, и о тебе оно ничего не говорит.",
        },
      },
      {
        text: "I have always been a very hard-working and responsible person.",
        correct: false,
        why: {
          en: "A claim anyone could make. The reader has no reason to believe it — or to keep reading.",
          ru: "Так может сказать о себе кто угодно. У читателя нет причин в это верить — и читать дальше.",
        },
      },
      {
        text: "My grandmother keeps her savings in a pickle jar labelled \"Not pickles.\"",
        correct: true,
        why: {
          en: "A specific, surprising image from real life. It raises a question the reader wants answered.",
          ru: "Конкретный и неожиданный образ из жизни. Он вызывает вопрос, на который хочется получить ответ.",
        },
      },
      {
        text: "Since the dawn of time, humans have always wanted to learn.",
        correct: false,
        why: {
          en: "A giant statement about humanity is the opposite of personal — and readers see it constantly.",
          ru: "Громкое утверждение о человечестве — противоположность личного, и такое читают постоянно.",
        },
      },
    ],
    model: "My grandmother keeps her savings in a pickle jar labelled \"Not pickles.\"",
    modelWhy: {
      en: "Small, strange and true beats big and general every time.",
      ru: "Маленькое, странное и правдивое всегда сильнее большого и общего.",
    },
  },
  {
    id: "hook-cut-warmup",
    unit: "hook",
    kind: "rewrite",
    title: { en: "Cut the warm-up", ru: "Убери разгон" },
    task: {
      en: "The first sentences just clear their throat. Keep only what earns the opening — 30 words at most.",
      ru: "Первые предложения просто «прокашливаются». Оставь только то, что заслуживает быть началом, — не больше 30 слов.",
    },
    source:
      "Many people have hobbies. Some people like sports, and some people like music. For me, it has always been chess. Chess is a game that requires a lot of thinking. Last March, I lost a tournament game in eleven moves to a nine-year-old.",
    placeholder: "Last March, I lost...",
    rules: [
      {
        type: "avoid",
        words: ["many people", "some people", "always been"],
        label: { en: "warm-up lines", ru: "фразы для разгона" },
      },
      { type: "concrete" },
      { type: "maxWords", n: 30 },
    ],
    model: "Last March, I lost a tournament game in eleven moves to a nine-year-old. He shook my hand without looking up from his juice box.",
    modelWhy: {
      en: "The real hook was hiding in the fifth sentence. Moving it to the front — and adding one detail — does all the work.",
      ru: "Настоящая зацепка пряталась в пятом предложении. Стоило перенести её в начало и добавить одну деталь — и всё заработало.",
    },
  },

  {
    id: "hook-question",
    unit: "hook",
    kind: "rewrite",
    title: { en: "Drop the rhetorical question", ru: "Убери риторический вопрос" },
    task: {
      en: "Opening with a question to the reader is a warm-up in disguise. Start with a real moment instead — one or two sentences.",
      ru: "Вопрос к читателю в начале — это тот же разгон, только замаскированный. Начни с реального момента — одно-два предложения.",
    },
    source: "Have you ever wondered what it feels like to fail at something you love?",
    placeholder: "At 7:15 on the morning of...",
    rules: [
      {
        type: "avoid",
        words: ["have you ever", "wondered", "imagine"],
        label: { en: "a question to the reader", ru: "вопрос к читателю" },
      },
      { type: "concrete" },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 35 },
    ],
    model: "At 7:15 on the morning of the regional olympiad, I realised I had revised the wrong chapter.",
    modelWhy: {
      en: "The reader doesn't need to be asked how failure feels — the time and the mistake make them feel it.",
      ru: "Читателя не нужно спрашивать, каково это — провалиться: время и ошибка заставляют это почувствовать.",
    },
  },
  {
    id: "hook-quote",
    unit: "hook",
    kind: "choose",
    title: { en: "Your words, not a famous quote", ru: "Свои слова, а не цитата" },
    task: {
      en: "Which opening quote actually belongs in a personal essay?",
      ru: "Какая цитата в начале действительно уместна в личном эссе?",
    },
    options: [
      {
        text: "As Albert Einstein once said, \"Imagination is more important than knowledge.\"",
        correct: false,
        why: {
          en: "A famous quote borrows someone else's voice in the one place yours matters most — and readers have seen this one hundreds of times.",
          ru: "Знаменитая цитата — чужой голос там, где важнее всего твой. И эту фразу читали сотни раз.",
        },
      },
      {
        text: "\"You can't sell a cake that's still on fire,\" my brother said, taking the tray out of my hands.",
        correct: true,
        why: {
          en: "A quote from your own life: funny, specific, and it drops the reader into a scene.",
          ru: "Цитата из твоей жизни: смешно, конкретно и сразу переносит читателя в сцену.",
        },
      },
      {
        text: "\"Success is not final, failure is not fatal,\" as the saying goes.",
        correct: false,
        why: {
          en: "A poster slogan tells the reader nothing about you.",
          ru: "Лозунг с плаката ничего не говорит о тебе.",
        },
      },
      {
        text: "Everyone has a story, and this is mine.",
        correct: false,
        why: {
          en: "It announces a story instead of starting one.",
          ru: "Объявляет историю вместо того, чтобы её начать.",
        },
      },
    ],
    model: "\"You can't sell a cake that's still on fire,\" my brother said, taking the tray out of my hands.",
    modelWhy: {
      en: "The best quote in your essay is one only you could have heard.",
      ru: "Лучшая цитата в эссе — та, что прозвучала в твоей собственной жизни.",
    },
  },

  // ── Specific story ──────────────────────────────────────────────────────
  {
    id: "spec-show",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "Show, don't tell", ru: "Покажи, а не расскажи" },
    task: {
      en: "This sentence tells the reader what to think. Rewrite it as a small scene they can picture, in 1–3 sentences.",
      ru: "Это предложение говорит читателю, что думать. Перепиши его как маленькую сцену, которую можно представить, — в 1–3 предложениях.",
    },
    source: "I am a very hardworking and passionate person who never gives up.",
    placeholder: "At 6 a.m. the gym was still dark when I...",
    rules: [
      {
        type: "avoid",
        words: ["hardworking", "hard-working", "passionate", "never give", "dedicated", "determined"],
        label: TELLING,
      },
      { type: "noCliches" },
      { type: "concrete" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "By the fortieth failed run of our robot's turning code, my sister had gone to bed. I rewrote the loop at 1:12 a.m., and at 1:40 the robot finally rolled around the chair leg.",
    modelWhy: {
      en: "Numbers, a time, a person and an action prove \"hardworking\" without ever saying it.",
      ru: "Цифры, время, человек и действие доказывают «hardworking», ни разу не произнося этого слова.",
    },
  },
  {
    id: "spec-number",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "Swap vague for a number", ru: "Замени расплывчатое цифрой" },
    task: {
      en: "\"A lot\" and \"really hard\" are invisible. Replace them with numbers and details that show how much.",
      ru: "«A lot» и «really hard» ничего не показывают. Замени их цифрами и деталями, которые показывают, сколько именно.",
    },
    source: "I spent a lot of time practicing the piano, and it was really hard.",
    placeholder: "For 41 days...",
    rules: [
      {
        type: "include",
        pattern: "\\d|\\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred)\\b",
        label: { en: "Has a number", ru: "Есть число" },
        hint: { en: "Add a number: how many hours, days or tries?", ru: "Добавь число: сколько часов, дней или попыток?" },
      },
      { type: "avoid", words: ["a lot", "really hard"], label: { en: "vague amounts", ru: "расплывчатые количества" } },
      { type: "noFillers" },
      { type: "maxWords", n: 50 },
    ],
    model:
      "I practised the same eight bars of Chopin for 41 days, two hours before school, until my neighbour started humming them through the wall.",
    modelWhy: {
      en: "\"41 days\" and the neighbour humming make the effort real — and a little funny.",
      ru: "«41 день» и сосед, напевающий за стеной, делают усилия настоящими — и немного смешными.",
    },
  },
  {
    id: "spec-senses",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "Add something a reader could sense", ru: "Добавь то, что можно почувствовать" },
    task: {
      en: "\"Busy\" and \"interesting\" show nothing. Describe the place through what you saw, heard or smelled.",
      ru: "«Busy» и «interesting» ничего не показывают. Опиши место через то, что там было видно, слышно и чем пахло.",
    },
    source: "The market was busy and interesting.",
    placeholder: "At the bazaar, a man...",
    rules: [
      { type: "sensory" },
      { type: "avoid", words: ["busy", "interesting"], label: { en: "empty adjectives", ru: "пустые прилагательные" } },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 60 },
    ],
    model:
      "At the Green Bazaar, a man sliced sausage with a knife as long as my forearm while a speaker two stalls over played the same pop song for the third time.",
    modelWhy: {
      en: "A sight (the knife) and a sound (the looping song) put the reader in the market.",
      ru: "Что-то видимое (нож) и что-то слышимое (песня по кругу) переносят читателя на базар.",
    },
  },
  {
    id: "spec-name",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "Name the person", ru: "Назови человека" },
    task: {
      en: "\"Someone\" is nobody. Name the person and show one thing they actually did.",
      ru: "«Someone» — это никто. Назови человека по имени и покажи одно, что он действительно сделал.",
    },
    source: "Someone at my school helped me a lot with physics.",
    placeholder: "Mr. ... stayed after the last bell and...",
    rules: [
      { type: "name" },
      { type: "avoid", words: ["someone", "helped me a lot"], label: { en: "vague wording", ru: "расплывчатые слова" } },
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 50 },
    ],
    model:
      "Every Thursday after the last bell, Mr. Seitkali made me explain Newton's third law to a room of empty chairs until I could do it without notes.",
    modelWhy: {
      en: "A name, a day and one strange, specific habit tell us more than \"helped a lot\" ever could.",
      ru: "Имя, день недели и одна странная, конкретная привычка говорят больше, чем любое «helped a lot».",
    },
  },
  {
    id: "spec-list-to-scene",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "Turn a list into one scene", ru: "Преврати список в одну сцену" },
    task: {
      en: "A list of titles is a résumé, not a story. Pick ONE of these and show a single moment from it.",
      ru: "Список званий — это резюме, а не история. Выбери ОДНО из них и покажи один момент.",
    },
    source:
      "I was president of the debate club, captain of the volleyball team, a volunteer at an animal shelter, and a winner of the regional math olympiad.",
    placeholder: "Pick one — debate, volleyball, the shelter or the olympiad...",
    rules: [
      {
        type: "atMostOf",
        words: ["debate", "volleyball", "shelter", "olympiad"],
        max: 1,
        label: { en: "Focuses on one thing", ru: "Сосредоточено на одном" },
      },
      { type: "concrete" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "At the shelter, a grey dog named Bars bit my sleeve on my first Tuesday. By March he slept with his head on my shoe while I filled in the feeding chart.",
    modelWhy: {
      en: "One place, one animal, two moments months apart — the change tells the story the list couldn't.",
      ru: "Одно место, одно животное, два момента с разницей в месяцы — перемена рассказывает то, чего не мог список.",
    },
  },

  {
    id: "spec-one-time",
    unit: "specificity",
    kind: "rewrite",
    title: { en: "One time, not \"always\"", ru: "Один случай, а не «always»" },
    task: {
      en: "A habit is hard to picture. Replace \"always\" with one particular time it happened — who, when, what.",
      ru: "Привычку трудно представить. Замени «always» одним конкретным случаем — кто, когда, что было.",
    },
    source: "I always help my classmates with their homework, and they always thank me.",
    placeholder: "The night before the chemistry final...",
    rules: [
      {
        type: "avoid",
        words: ["always"],
        label: { en: "\"always\" — a habit instead of a moment", ru: "«always» — привычка вместо момента" },
      },
      { type: "concrete" },
      { type: "name" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 60 },
    ],
    model:
      "The night before the chemistry final, Aruzhan called me at 11 p.m. because moles made no sense to her. We balanced equations over video until she got three in a row without me.",
    modelWhy: {
      en: "One evening with a name and a time is more convincing than \"always\" — the reader sees you actually do it.",
      ru: "Один вечер с именем и временем убедительнее, чем «always», — читатель видит, как ты это делаешь.",
    },
  },
  {
    id: "spec-proof-pick",
    unit: "specificity",
    kind: "choose",
    title: { en: "Which detail proves it?", ru: "Какая деталь это доказывает?" },
    task: {
      en: "The claim is \"I'm curious.\" Which sentence proves it without saying it?",
      ru: "Утверждение: «I'm curious». Какое предложение доказывает это, не произнося?",
    },
    options: [
      {
        text: "I have always been an extremely curious person.",
        correct: false,
        why: {
          en: "It repeats the claim louder. Nothing here is evidence.",
          ru: "Повторяет утверждение, только громче. Доказательств нет.",
        },
      },
      {
        text: "I love learning new things every single day.",
        correct: false,
        why: {
          en: "Every applicant could write this. What things? Which day?",
          ru: "Так может написать любой абитуриент. Какие вещи? Какой день?",
        },
      },
      {
        text: "I once took our microwave apart to find out why it hummed, and the magnetron is still in a shoebox under my bed.",
        correct: true,
        why: {
          en: "An action, an object and a consequence — curiosity you can see.",
          ru: "Действие, предмет и последствие — любопытство, которое видно.",
        },
      },
      {
        text: "My teachers often say that I ask a lot of questions.",
        correct: false,
        why: {
          en: "Better — someone else noticed — but still no scene. Which question, to whom?",
          ru: "Уже лучше — это заметил кто-то другой, — но сцены всё ещё нет. Какой вопрос, кому?",
        },
      },
    ],
    model:
      "I once took our microwave apart to find out why it hummed, and the magnetron is still in a shoebox under my bed.",
    modelWhy: {
      en: "Evidence beats adjectives: let the reader reach \"curious\" on their own.",
      ru: "Доказательство сильнее прилагательных: пусть читатель сам придёт к слову «curious».",
    },
  },

  // ── Reflection ──────────────────────────────────────────────────────────
  {
    id: "refl-ladder",
    unit: "reflection",
    kind: "rewrite",
    title: { en: "Climb the reflection ladder", ru: "Поднимись по лестнице рефлексии" },
    task: {
      en: "Here is the story. Write 2–3 sentences of reflection: what you understood, and what you do differently now.",
      ru: "Вот история. Напиши 2–3 предложения рефлексии: что тебе стало понятно и что ты теперь делаешь иначе.",
    },
    source:
      "During my first week volunteering at the shelter, a dog named Bars bit my sleeve. I kept coming back, and by March he slept with his head on my shoe.",
    placeholder: "I used to think... Now I...",
    rules: [
      {
        type: "include",
        pattern: "\\b(realis|realiz|understood|understand|noticed|thought|believed|used to)",
        label: { en: "Names what you understood", ru: "Есть вывод: что стало понятно" },
        hint: { en: "Say what you understood or used to believe.", ru: "Скажи, что тебе стало понятно или какое убеждение было раньше." },
      },
      {
        type: "include",
        pattern: "\\b(now|today|since then|these days|still)\\b",
        label: { en: "Says what you do differently now", ru: "Есть перемена: что ты делаешь иначе сейчас" },
        hint: { en: "Add what you do differently now.", ru: "Добавь, что ты теперь делаешь иначе." },
      },
      { type: "noCliches" },
      { type: "avoid", words: ["never give up", "valuable lesson", "taught me the importance"], label: STOCK_MORALS },
      { type: "maxSentences", n: 3 },
    ],
    model:
      "I used to think trust was earned by being nice. Bars showed me it's earned by being predictable — showing up at 4 p.m. every Tuesday even when nothing happens. Now, when a younger student in my robotics club goes quiet, I don't push; I just keep showing up.",
    modelWhy: {
      en: "Old belief → new understanding → a real behaviour today. Each rung is specific, and it grows out of the story.",
      ru: "Старое убеждение → новое понимание → реальное поведение сегодня. Каждая ступень конкретна и вырастает из истории.",
    },
  },
  {
    id: "refl-generic",
    unit: "reflection",
    kind: "rewrite",
    title: { en: "Replace the generic lesson", ru: "Замени шаблонный вывод" },
    task: {
      en: "Every reader has seen this moral. Write what YOU actually learned — something only your story could teach.",
      ru: "Этот вывод видел каждый читатель. Напиши, что стало понятно именно ТЕБЕ, — то, чему могла научить только твоя история.",
    },
    source: "This experience taught me to never give up and that hard work pays off.",
    placeholder: "What surprised me was...",
    rules: [
      { type: "noCliches" },
      { type: "avoid", words: ["never give up", "hard work", "taught me"], label: STOCK_MORALS },
      { type: "rewritten" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 70 },
    ],
    model:
      "What surprised me was that the fix never came from trying harder. It came on the day I finally asked the eleventh-grader I'd been too proud to ask.",
    modelWhy: {
      en: "A precise, slightly uncomfortable insight — far more believable than a poster slogan.",
      ru: "Точная и немного неудобная мысль — куда убедительнее лозунга с плаката.",
    },
  },
  {
    id: "refl-connect",
    unit: "reflection",
    kind: "rewrite",
    title: { en: "Connect the lesson to the story", ru: "Свяжи вывод с историей" },
    task: {
      en: "The moral floats away from the story. Write a reflection that grows out of it — mention something from the story itself.",
      ru: "Вывод оторван от истории. Напиши рефлексию, которая из неё вырастает, — упомяни что-то из самой истории.",
    },
    source:
      "Story: I rebuilt my grandfather's broken radio using YouTube tutorials and parts from a flea market.\nEnding: This showed me that I want to change the world.",
    placeholder: "Holding the radio...",
    rules: [
      {
        type: "include",
        pattern: "radio|grandfather|grandpa|flea market|parts|tutorial|solder|wire",
        label: { en: "Links back to the story", ru: "Связано с историей" },
        hint: {
          en: "Mention something from the story — the radio, your grandfather, the parts.",
          ru: "Упомяни что-то из истории — радио, дедушку, детали.",
        },
      },
      {
        type: "avoid",
        words: ["change the world", "make the world a better place", "make a difference"],
        label: { en: "a giant claim", ru: "громкие заявления" },
      },
      { type: "noCliches" },
      { type: "maxSentences", n: 3 },
    ],
    model:
      "When the radio crackled into my grandfather's old station, I realised that most \"broken\" things are just things nobody has opened yet. I now keep a box of flea-market parts under my bed and take apart one thing a month.",
    modelWhy: {
      en: "The insight comes straight from the radio, and the habit at the end proves it stuck.",
      ru: "Мысль вырастает прямо из радио, а привычка в конце доказывает, что она осталась с тобой.",
    },
  },
  {
    id: "refl-pick",
    unit: "reflection",
    kind: "choose",
    title: { en: "Spot real insight", ru: "Найди настоящий вывод" },
    task: {
      en: "Which ending shows genuine reflection rather than a slogan?",
      ru: "Какая концовка показывает настоящую рефлексию, а не лозунг?",
    },
    options: [
      {
        text: "This experience made me who I am today.",
        correct: false,
        why: {
          en: "It says something changed but never says what. Readers see this line constantly.",
          ru: "Говорит, что что-то изменилось, но не говорит, что именно. Эту фразу читают постоянно.",
        },
      },
      {
        text: "I learned that teamwork makes the dream work.",
        correct: false,
        why: {
          en: "A slogan, not a thought. It could close any essay about any team.",
          ru: "Лозунг, а не мысль. Им можно закончить любое эссе о любой команде.",
        },
      },
      {
        text: "I still flinch when someone says \"just wing it\" — but now I write the plan on the back of my hand first.",
        correct: true,
        why: {
          en: "Honest (the flinch), specific (the hand) and shows a real, lasting change in behaviour.",
          ru: "Честно (вздрагиваю), конкретно (план на руке) и показывает реальную, устойчивую перемену в поведении.",
        },
      },
      {
        text: "In conclusion, it was a valuable lesson that I will never forget.",
        correct: false,
        why: {
          en: "\"In conclusion\" belongs in school reports, and the lesson itself is never named.",
          ru: "«In conclusion» — для школьных докладов, а сам урок так и не назван.",
        },
      },
    ],
    model: "I still flinch when someone says \"just wing it\" — but now I write the plan on the back of my hand first.",
    modelWhy: {
      en: "Reflection is a change you can see, not a label for one.",
      ru: "Рефлексия — это перемена, которую видно, а не ярлык для неё.",
    },
  },

  {
    id: "refl-before-after",
    unit: "reflection",
    kind: "rewrite",
    title: { en: "Show then and now", ru: "Покажи «тогда» и «сейчас»" },
    task: {
      en: "\"Shy\" and \"confident\" are labels. Show the change through two things you did — one before, one now.",
      ru: "«Shy» и «confident» — ярлыки. Покажи перемену через два поступка: один тогда, один сейчас.",
    },
    source: "Before the debate club I was shy, and after it I became confident.",
    placeholder: "In ninth grade I... Now I...",
    rules: [
      { type: "avoid", words: ["shy", "confident", "became"], label: TELLING },
      {
        type: "include",
        pattern: "\\b(now|today|these days|this year|since then)\\b",
        label: { en: "Shows how it is now", ru: "Показано, как сейчас" },
        hint: { en: "Add what you do now.", ru: "Добавь, что ты делаешь сейчас." },
      },
      { type: "concrete" },
      { type: "maxSentences", n: 3 },
      { type: "maxWords", n: 60 },
    ],
    model:
      "In ninth grade I rehearsed my canteen order in my head before reaching the counter. Now I open our debate club's Friday rounds by asking the question nobody wants to answer first.",
    modelWhy: {
      en: "Two small, true behaviours side by side — the reader measures the change for themselves.",
      ru: "Два небольших правдивых поступка рядом — читатель сам оценивает, насколько всё изменилось.",
    },
  },
  {
    id: "refl-so-what",
    unit: "reflection",
    kind: "rewrite",
    title: { en: "Answer \"so what?\"", ru: "Ответь на «и что?»" },
    task: {
      en: "An achievement on its own is a line from your CV. Keep it and add 1–2 sentences: what did it change in how you think or work?",
      ru: "Достижение само по себе — строчка из резюме. Оставь его и добавь 1–2 предложения: что оно изменило в том, как ты думаешь или работаешь?",
    },
    source: "I won second place in the regional physics olympiad.",
    placeholder: "I won second place in the regional physics olympiad. The problem I lost points on...",
    rules: [
      {
        type: "include",
        pattern: "\\b(realis|realiz|understood|noticed|learned|learnt|used to|now\\b)",
        label: { en: "Says what changed", ru: "Сказано, что изменилось" },
        hint: {
          en: "Add what you realised, or what you do differently now.",
          ru: "Добавь, что тебе стало понятно или что ты теперь делаешь иначе.",
        },
      },
      { type: "avoid", words: ["proud", "valuable lesson", "taught me the importance"], label: STOCK_MORALS },
      { type: "noCliches" },
      { type: "minWords", n: 20 },
      { type: "maxSentences", n: 3 },
    ],
    model:
      "I won second place in the regional physics olympiad. The problem I lost points on was one I had skipped in practice because it looked boring, and I realised I only trained on problems I liked. Now I start every practice set with the one I most want to skip.",
    modelWhy: {
      en: "The medal becomes a story about how you think — and the new habit proves the lesson stuck.",
      ru: "Медаль превращается в историю о том, как ты думаешь, а новая привычка доказывает, что урок усвоен.",
    },
  },

  // ── Voice ───────────────────────────────────────────────────────────────
  {
    id: "voice-thesaurus",
    unit: "voice",
    kind: "rewrite",
    title: { en: "Un-thesaurus it", ru: "Убери словарные слова" },
    task: {
      en: "Nobody talks like this. Say the same thing in plain words a real 17-year-old would use.",
      ru: "Так никто не говорит. Скажи то же самое простыми словами, которыми говорят настоящие 17-летние.",
    },
    source:
      "Utilizing my multifaceted proclivities, I endeavored to ameliorate the pedagogical milieu of my institution.",
    placeholder: "I wanted our school to...",
    rules: [
      {
        type: "avoid",
        words: ["utiliz", "multifaceted", "proclivit", "endeavo", "ameliorat", "pedagogic", "milieu", "institution"],
        label: { en: "thesaurus words", ru: "словарные слова" },
      },
      { type: "maxWords", n: 35 },
      { type: "minWords", n: 6 },
    ],
    model: "I wanted our school to teach better, so I started a Friday club where students explain hard topics to each other.",
    modelWhy: {
      en: "Plain words make the actual idea visible — and it turns out to be a good one.",
      ru: "Простые слова делают видной саму идею — и она оказывается хорошей.",
    },
  },
  {
    id: "voice-friend",
    unit: "voice",
    kind: "rewrite",
    title: { en: "Tell it to a friend", ru: "Расскажи как другу" },
    task: {
      en: "This sounds like a report. Say what really happened the way you'd tell a friend — one or two sentences.",
      ru: "Звучит как отчёт. Расскажи, что было на самом деле, так, как рассказываешь другу, — одно-два предложения.",
    },
    source:
      "Participation in the robotics competition was a profoundly transformative experience that significantly enhanced my collaborative capabilities.",
    placeholder: "At the robotics finals...",
    rules: [
      {
        type: "avoid",
        words: ["profound", "transformative", "significantly", "enhanc", "capabilit", "participation"],
        label: { en: "report words", ru: "канцелярские слова" },
      },
      { type: "noPassive" },
      { type: "concrete" },
      { type: "maxSentences", n: 2 },
    ],
    model:
      "At the robotics finals our arm dropped the ball three times, and I finally stopped trying to fix everything myself and let Dana rewrite the grip code.",
    modelWhy: {
      en: "It's what actually happened, told simply — and it shows teamwork instead of claiming it.",
      ru: "Это то, что произошло на самом деле, рассказанное просто, — и оно показывает командную работу, а не заявляет о ней.",
    },
  },
  {
    id: "voice-pick",
    unit: "voice",
    kind: "choose",
    title: { en: "Which one sounds like a person?", ru: "Где слышен живой человек?" },
    task: {
      en: "Pick the sentence with a real, distinct voice.",
      ru: "Выбери предложение с настоящим, узнаваемым голосом.",
    },
    options: [
      {
        text: "My passion for mathematics has been an integral part of my academic journey.",
        correct: false,
        why: {
          en: "Could be written by anyone — or by a template. No person is visible behind it.",
          ru: "Это мог написать кто угодно — или шаблон. За фразой не видно человека.",
        },
      },
      {
        text: "I am a highly motivated individual with excellent communication skills.",
        correct: false,
        why: {
          en: "This is a CV line, not an essay voice.",
          ru: "Это строчка из резюме, а не голос эссе.",
        },
      },
      {
        text: "I trust numbers more than people, which is a problem when you're the class treasurer.",
        correct: true,
        why: {
          en: "Honest, a bit self-mocking and specific — you can hear a real person.",
          ru: "Честно, с долей самоиронии и конкретно — слышен живой человек.",
        },
      },
    ],
    model: "I trust numbers more than people, which is a problem when you're the class treasurer.",
    modelWhy: {
      en: "Voice is honesty plus a detail only you would notice.",
      ru: "Голос — это честность плюс деталь, которую замечаешь только ты.",
    },
  },

  {
    id: "voice-closer",
    unit: "voice",
    kind: "rewrite",
    title: { en: "Drop the brochure ending", ru: "Убери концовку из брошюры" },
    task: {
      en: "This last line sounds like an advert. End with something only you would say — plain words, one or two sentences.",
      ru: "Последняя фраза звучит как реклама. Закончи тем, что можешь сказать только ты, — простыми словами, одно-два предложения.",
    },
    source: "Therefore, I firmly believe that I would be an invaluable asset to your prestigious university.",
    placeholder: "In my first semester I'd like to...",
    rules: [
      {
        type: "avoid",
        words: ["invaluable", "asset", "prestigious", "firmly believe", "therefore"],
        label: { en: "brochure words", ru: "слова из рекламной брошюры" },
      },
      { type: "noCliches" },
      { type: "maxSentences", n: 2 },
      { type: "minWords", n: 8 },
      { type: "maxWords", n: 40 },
    ],
    model:
      "In my first semester I'd like to find the lab that still smells of solder at midnight, and ask if they need someone to sweep.",
    modelWhy: {
      en: "Humble, specific and a little funny — the reader finishes smiling at a person, not a sales pitch.",
      ru: "Скромно, конкретно и немного смешно — читатель заканчивает с улыбкой, глядя на человека, а не на рекламу.",
    },
  },
  {
    id: "voice-honest-pick",
    unit: "voice",
    kind: "choose",
    title: { en: "Honest or polished?", ru: "Честно или «отполировано»?" },
    task: {
      en: "Which sentence about failing sounds like a real person?",
      ru: "Какая фраза о неудаче звучит как слова живого человека?",
    },
    options: [
      {
        text: "Although I faced numerous challenges, I persevered and ultimately triumphed.",
        correct: false,
        why: {
          en: "Polished until nothing is left: which challenges? What did winning look like?",
          ru: "Отполировано до пустоты: какие трудности? Как выглядела победа?",
        },
      },
      {
        text: "Failure has always been my greatest teacher.",
        correct: false,
        why: {
          en: "A saying, not an experience — no failure is actually described.",
          ru: "Поговорка, а не опыт: ни одна неудача на самом деле не описана.",
        },
      },
      {
        text: "I failed my driving test twice, both times at the same roundabout, and by the second time the examiner remembered my name.",
        correct: true,
        why: {
          en: "Specific, a little embarrassing and self-aware — that honesty is what readers trust.",
          ru: "Конкретно, немного неловко и с самоиронией — именно такой честности читатели доверяют.",
        },
      },
    ],
    model:
      "I failed my driving test twice, both times at the same roundabout, and by the second time the examiner remembered my name.",
    modelWhy: {
      en: "Admitting something small and real sounds stronger than claiming something big.",
      ru: "Признать что-то маленькое и настоящее звучит сильнее, чем заявить о чём-то большом.",
    },
  },

  // ── Concise language ────────────────────────────────────────────────────
  {
    id: "concise-80",
    unit: "concise",
    kind: "rewrite",
    title: { en: "Cut it to 80 words", ru: "Сократи до 80 слов" },
    task: {
      en: "Keep the story, lose the padding. Get this paragraph down to 80 words or fewer.",
      ru: "Сохрани историю, убери воду. Сократи абзац до 80 слов или меньше.",
    },
    source:
      "Basically, when I first started working at my uncle's small car repair shop during the summer holidays, I honestly did not really know anything at all about cars or engines or anything like that. At first, I was only allowed to sweep the floors and bring tea to the customers who were waiting. However, after a few weeks of watching very carefully, my uncle finally let me change the oil on an old white Lada by myself, and I was extremely proud of myself because it was the first time that I had ever actually fixed something that was real and that people actually needed to use every day.",
    placeholder: "The summer I started at my uncle's garage...",
    rules: [
      { type: "maxWords", n: 80 },
      { type: "minWords", n: 35 },
      { type: "noFillers" },
      {
        type: "include",
        pattern: "lada|oil|uncle|shop|garage",
        label: { en: "Keeps the story", ru: "История сохранена" },
        hint: {
          en: "Keep the core of the story — your uncle's shop and the oil change.",
          ru: "Сохрани суть истории — мастерскую дяди и замену масла.",
        },
      },
    ],
    model:
      "The summer I started at my uncle's garage, I knew nothing about engines. For three weeks I swept floors and carried tea to waiting customers. Then my uncle handed me a wrench and pointed at an old white Lada. Changing that oil myself was the first time I'd fixed something real — something a family would drive to work the next morning.",
    modelWhy: {
      en: "Fillers and repeats are gone; every sentence moves the story forward, and it ends on an image.",
      ru: "Слова-паразиты и повторы ушли; каждое предложение двигает историю, а заканчивается она образом.",
    },
  },
  {
    id: "concise-fillers",
    unit: "concise",
    kind: "rewrite",
    title: { en: "Kill the fillers", ru: "Убери слова-паразиты" },
    task: {
      en: "Stacked intensifiers make a sentence weaker, not stronger. Show the nerves in 18 words or fewer.",
      ru: "Нагромождение усилителей делает фразу слабее, а не сильнее. Покажи волнение — не больше 18 слов.",
    },
    source:
      "Basically, I was really very nervous, and it was literally the most extremely stressful day of my whole entire life.",
    placeholder: "My hands shook so hard...",
    rules: [
      { type: "noFillers" },
      {
        type: "avoid",
        words: ["whole entire", "most stressful", "nervous"],
        label: { en: "telling words", ru: "слова-ярлыки" },
      },
      { type: "maxWords", n: 18 },
    ],
    model: "My hands shook so hard I couldn't unzip my violin case.",
    modelWhy: {
      en: "One physical detail shows the nerves better than five intensifiers.",
      ru: "Одна физическая деталь показывает волнение лучше пяти усилителей.",
    },
  },
  {
    id: "concise-passive",
    unit: "concise",
    kind: "rewrite",
    title: { en: "Say who did it", ru: "Скажи, кто это сделал" },
    task: {
      en: "Passive voice hides the people. Rewrite so the actors come first — 25 words at most.",
      ru: "Пассивный залог прячет людей. Перепиши так, чтобы действующие лица шли первыми, — не больше 25 слов.",
    },
    source: "The decision was made by our team to rebuild the project, and a new plan was written by me in two nights.",
    placeholder: "Our team decided...",
    rules: [{ type: "noPassive" }, { type: "maxWords", n: 25 }, { type: "rewritten" }],
    model: "Our team decided to start over, and I wrote the new plan in two nights.",
    modelWhy: {
      en: "Active verbs are shorter, clearer — and put you in the story.",
      ru: "Активные глаголы короче и яснее — и ставят тебя в центр истории.",
    },
  },
  {
    id: "concise-merge",
    unit: "concise",
    kind: "rewrite",
    title: { en: "Merge the repeats", ru: "Объедини повторы" },
    task: {
      en: "Five choppy sentences repeat themselves. Merge them into one or two, 30 words at most.",
      ru: "Пять рубленых предложений повторяют друг друга. Объедини их в одно-два, не больше 30 слов.",
    },
    source:
      "I joined the school newspaper. I joined it in ninth grade. At the newspaper I wrote articles. The articles were about school problems. One article was about the broken heating.",
    placeholder: "In ninth grade I joined...",
    rules: [
      { type: "maxSentences", n: 2 },
      { type: "maxWords", n: 30 },
      {
        type: "include",
        pattern: "heating",
        label: { en: "Keeps the key detail", ru: "Главная деталь на месте" },
        hint: {
          en: "Keep the broken heating — it's the most specific detail.",
          ru: "Сохрани сломанное отопление — это самая конкретная деталь.",
        },
      },
    ],
    model: "In ninth grade I joined the school newspaper and wrote about what was broken — starting with the heating in Room 214.",
    modelWhy: {
      en: "One sentence, no repeats, and a sharper detail at the end.",
      ru: "Одно предложение, никаких повторов и более точная деталь в конце.",
    },
  },
  {
    id: "concise-empty",
    unit: "concise",
    kind: "rewrite",
    title: { en: "Cut the empty constructions", ru: "Убери пустые конструкции" },
    task: {
      en: "\"There were… who were… the fact that…\" — the sentence is mostly scaffolding. Say it in 15 words or fewer.",
      ru: "«There were… who were… the fact that…» — предложение почти целиком из подпорок. Скажи то же самое не больше чем в 15 словах.",
    },
    source:
      "There were many students who were interested in the fact that our club was doing a project that was about recycling.",
    placeholder: "Many students wanted...",
    rules: [
      {
        type: "avoid",
        words: ["there were", "the fact that", "who were", "that was"],
        label: { en: "empty constructions", ru: "пустые конструкции" },
      },
      { type: "noFillers" },
      { type: "maxWords", n: 15 },
    ],
    model: "Many students wanted to join our club's recycling project.",
    modelWhy: {
      en: "Twenty-two words became nine, and nothing was lost.",
      ru: "Из двадцати двух слов осталось девять, и ничего не потерялось.",
    },
  },
  {
    id: "concise-pick",
    unit: "concise",
    kind: "choose",
    title: { en: "Which one earns every word?", ru: "Где каждое слово на месте?" },
    task: {
      en: "All four say kindness matters. Which one wastes no words?",
      ru: "Все четыре говорят, что доброта важна. В каком нет лишних слов?",
    },
    options: [
      {
        text: "In my opinion, I personally think that it is very important to be kind to others.",
        correct: false,
        why: {
          en: "\"In my opinion\", \"I personally think\" and \"very\" all say the same nothing.",
          ru: "«In my opinion», «I personally think» и «very» — три раза одно и то же ни о чём.",
        },
      },
      {
        text: "Being kind to others is important due to the fact that kindness is important.",
        correct: false,
        why: {
          en: "Circular: the reason repeats the claim.",
          ru: "Замкнутый круг: причина повторяет утверждение.",
        },
      },
      {
        text: "I learned kindness at 2 a.m. in a hospital corridor, from a nurse who brought my mother tea.",
        correct: true,
        why: {
          en: "Every word adds something — time, place, person, action.",
          ru: "Каждое слово что-то добавляет: время, место, человека, действие.",
        },
      },
      {
        text: "Kindness is something that is really, really important in today's modern world.",
        correct: false,
        why: {
          en: "Fillers and a repeat (\"today's modern\") — and still no example.",
          ru: "Слова-паразиты и повтор («today's modern») — и всё равно ни одного примера.",
        },
      },
    ],
    model: "I learned kindness at 2 a.m. in a hospital corridor, from a nurse who brought my mother tea.",
    modelWhy: {
      en: "Concise doesn't mean short — it means nothing is there for decoration.",
      ru: "Лаконично — не значит коротко. Это значит, что нет ничего для украшения.",
    },
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
