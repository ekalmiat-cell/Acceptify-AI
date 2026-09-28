/**
 * The admissions-interview question bank: the questions that come up again
 * and again, what the interviewer is really listening for, the usual way
 * answers go wrong, and how a strong answer might open.
 *
 * Same split as the essay course (lib/training/drills.ts):
 * - the questions and sample openings are English — that's the language the
 *   interview happens in;
 * - explanations (`Localized`) follow the interface language.
 *
 * Written for Acceptify, not copied from any university's materials. Pure
 * data, no AI — the voice practice mode will build on top of it.
 */

import type { Localized } from "@/lib/training/drills";

export type CategoryKey = "you" | "why" | "story" | "thinking" | "closing";

/** Where a question tends to come up — for the filter chips. */
export type Region = "us" | "uk" | "scholarship";

export interface Category {
  key: CategoryKey;
  title: Localized;
}

export interface InterviewQuestion {
  id: string;
  category: CategoryKey;
  regions: Region[];
  /** The question as it's asked — English. */
  question: string;
  /** What they are really listening for. */
  lookFor: Localized;
  /** The most common way the answer goes wrong. */
  avoid: Localized;
  /** How a strong answer might open — English. */
  start: string;
}

export const CATEGORIES: Category[] = [
  { key: "you", title: { en: "About you", ru: "О себе" } },
  { key: "why", title: { en: "Why us, why this field", ru: "Почему мы и это направление" } },
  { key: "story", title: { en: "Your experience", ru: "Твой опыт" } },
  { key: "thinking", title: { en: "How you think", ru: "Как ты думаешь" } },
  { key: "closing", title: { en: "The last minutes", ru: "Последние минуты" } },
];

export const REGIONS: { key: Region; title: Localized }[] = [
  { key: "us", title: { en: "USA", ru: "США" } },
  { key: "uk", title: { en: "UK", ru: "Великобритания" } },
  { key: "scholarship", title: { en: "Scholarships & Asia", ru: "Стипендии и Азия" } },
];

export const QUESTIONS: InterviewQuestion[] = [
  // ── About you ───────────────────────────────────────────────────────────
  {
    id: "tell-me",
    category: "you",
    regions: ["us", "uk", "scholarship"],
    question: "Tell me about yourself.",
    lookFor: {
      en: "Not your CV read aloud — two or three things that make you who you are, with one small story. It sets the direction for the whole conversation.",
      ru: "Не пересказ резюме, а две-три вещи, которые делают тебя тобой, и одна короткая история. Этот ответ задаёт направление всему разговору.",
    },
    avoid: {
      en: "Listing grades and awards for three minutes, or starting with \"My name is… I was born in…\".",
      ru: "Три минуты перечислять оценки и награды или начинать с «My name is… I was born in…».",
    },
    start: "I'm the person in my class who fixes the printer — and lately I've been trying to figure out why it breaks in the first place.",
  },
  {
    id: "strengths",
    category: "you",
    regions: ["us", "scholarship"],
    question: "What is your greatest strength?",
    lookFor: {
      en: "One strength, proven by one specific moment. Bonus if it fits what you want to study.",
      ru: "Одна сильная сторона, доказанная одним конкретным моментом. Плюс, если она связана с тем, что ты хочешь изучать.",
    },
    avoid: {
      en: "Naming three adjectives (\"hardworking, responsible, creative\") with no evidence.",
      ru: "Назвать три прилагательных («hardworking, responsible, creative») без доказательств.",
    },
    start: "I stay with a problem longer than most people — last spring I spent three weeks on one geometry question before it clicked.",
  },
  {
    id: "weakness",
    category: "you",
    regions: ["us", "scholarship"],
    question: "What is your biggest weakness?",
    lookFor: {
      en: "Honesty and self-awareness: a real weakness, and what you are actually doing about it.",
      ru: "Честность и самоанализ: настоящая слабость и то, что ты реально с ней делаешь.",
    },
    avoid: {
      en: "A disguised strength (\"I'm a perfectionist\", \"I work too hard\"). Interviewers hear it every day.",
      ru: "Замаскированная сила («I'm a perfectionist», «I work too hard»). Интервьюеры слышат это каждый день.",
    },
    start: "I tend to say yes to everything, and in October I ended up with four deadlines in one week. Now I keep a list and say no to one thing a month.",
  },
  {
    id: "three-words",
    category: "you",
    regions: ["us", "scholarship"],
    question: "How would your friends describe you in three words?",
    lookFor: {
      en: "Three words with a quick example for at least one — and a hint of humour is welcome.",
      ru: "Три слова и быстрый пример хотя бы к одному. Немного юмора только приветствуется.",
    },
    avoid: {
      en: "Three generic virtues with nothing behind them.",
      ru: "Три общих достоинства без подтверждения.",
    },
    start: "Stubborn, loud, and reliable — my friends say that if I promise to bring the speaker, the party is safe.",
  },
  {
    id: "free-time",
    category: "you",
    regions: ["us", "uk"],
    question: "What do you do when you're not studying?",
    lookFor: {
      en: "A real person behind the grades. Depth in one thing beats a list of ten hobbies.",
      ru: "Живого человека за оценками. Глубина в одном деле лучше списка из десяти хобби.",
    },
    avoid: {
      en: "\"I like reading, sports and music\" — and nothing more.",
      ru: "«I like reading, sports and music» — и больше ничего.",
    },
    start: "I bake — badly at first. I've kept a notebook of 40 failed sourdough loaves and what went wrong with each one.",
  },
  {
    id: "book",
    category: "you",
    regions: ["uk", "us"],
    question: "Tell me about a book you've read recently.",
    lookFor: {
      en: "That you actually engage with ideas: what the book argued, what you agreed or disagreed with, what it made you think about.",
      ru: "Что ты действительно работаешь с идеями: о чём книга, в чём ты с ней соглашаешься или споришь, о чём она заставила задуматься.",
    },
    avoid: {
      en: "Retelling the plot, or naming a book you haven't really read. They will ask follow-up questions.",
      ru: "Пересказывать сюжет или называть книгу, которую знаешь только понаслышке. Будут уточняющие вопросы.",
    },
    start: "I just finished a book on how cities grow, and I disagree with its main idea — at least for how my own city grew.",
  },

  // ── Why us, why this field ──────────────────────────────────────────────
  {
    id: "why-uni",
    category: "why",
    regions: ["us", "uk", "scholarship"],
    question: "Why do you want to study at this university?",
    lookFor: {
      en: "Specifics only this university has — a course, a professor, a lab, a club — tied to what you want to do there.",
      ru: "Конкретика, которая есть только у этого вуза: курс, профессор, лаборатория, клуб — и как это связано с тем, что ты хочешь там делать.",
    },
    avoid: {
      en: "Rankings, prestige, \"beautiful campus\" or \"great opportunities\" — true of every good university.",
      ru: "Рейтинги, престиж, «красивый кампус» или «большие возможности» — это есть у любого хорошего вуза.",
    },
    start: "Mainly because of the first-year design course — you build something for a real client in the first semester, and that's exactly how I learn.",
  },
  {
    id: "why-major",
    category: "why",
    regions: ["us", "uk", "scholarship"],
    question: "Why do you want to study this subject?",
    lookFor: {
      en: "The moment your interest started and what you've done since then to explore it beyond school lessons.",
      ru: "Момент, когда появился интерес, и что ты с тех пор делаешь, чтобы изучать это за пределами школьных уроков.",
    },
    avoid: {
      en: "\"It's a good career\" or \"my parents advised me\" as the whole answer.",
      ru: "«Это хорошая профессия» или «так посоветовали родители» — как весь ответ.",
    },
    start: "It started with a water bill. Ours doubled one winter, and I wanted to know who decides the price of water.",
  },
  {
    id: "why-abroad",
    category: "why",
    regions: ["scholarship", "us", "uk"],
    question: "Why do you want to study abroad rather than at home?",
    lookFor: {
      en: "A reason about learning, not escaping — and, for scholarships, how you plan to use it back home.",
      ru: "Причина, связанная с учёбой, а не с желанием уехать. Для стипендий — ещё и как ты применишь это дома.",
    },
    avoid: {
      en: "Criticising your home country's education, or \"I want to see the world\".",
      ru: "Критиковать образование в своей стране или говорить «I want to see the world».",
    },
    start: "The kind of hands-on research I want to do in materials science doesn't exist yet at home — I'd like to learn it and help build it there.",
  },
  {
    id: "ten-years",
    category: "why",
    regions: ["scholarship", "us"],
    question: "Where do you see yourself in ten years?",
    lookFor: {
      en: "A direction, not a fixed plan — and that it connects to what you'll study.",
      ru: "Направление, а не жёсткий план, — и что оно связано с тем, что ты будешь изучать.",
    },
    avoid: {
      en: "\"CEO of a big company\" or \"I'll change the world\" with no steps in between.",
      ru: "«CEO большой компании» или «изменю мир» без промежуточных шагов.",
    },
    start: "I hope to be working on how clinics in small towns keep their records — right now half of them still use paper.",
  },
  {
    id: "contribute",
    category: "why",
    regions: ["us"],
    question: "What would you bring to our community?",
    lookFor: {
      en: "Something concrete you'd actually do on campus, based on what you already do now.",
      ru: "Что-то конкретное, что ты действительно будешь делать в кампусе, — исходя из того, что делаешь уже сейчас.",
    },
    avoid: {
      en: "\"Diversity\" or \"a unique perspective\" without saying what it is.",
      ru: "«Diversity» или «a unique perspective» — не объясняя, в чём они.",
    },
    start: "Probably a Kazakh cooking night — I've run one for my class every month this year, and it's the easiest way I know to make strangers talk.",
  },

  // ── Your experience ─────────────────────────────────────────────────────
  {
    id: "challenge",
    category: "story",
    regions: ["us", "scholarship"],
    question: "Tell me about a challenge you overcame.",
    lookFor: {
      en: "A clear story: the situation, what YOU did, the result — and what you'd do the same or differently.",
      ru: "Понятная история: ситуация, твои собственные действия, результат — и что стоит повторить, а что сделать иначе.",
    },
    avoid: {
      en: "A challenge with no personal action in it, or a story that ends in \"and I never gave up\".",
      ru: "Трудность, в которой нет твоих действий, или история, которая заканчивается на «and I never gave up».",
    },
    start: "Two weeks before our science fair, our only sensor burned out, and the replacement would take a month to arrive.",
  },
  {
    id: "failure",
    category: "story",
    regions: ["us", "uk", "scholarship"],
    question: "Tell me about a time you failed.",
    lookFor: {
      en: "A real failure you own, and what changed in how you work afterwards. Maturity matters more than the failure itself.",
      ru: "Настоящая неудача, за которую ты берёшь ответственность, и что изменилось в твоей работе после. Зрелость важнее самой неудачи.",
    },
    avoid: {
      en: "A fake failure (\"I got a 4 instead of a 5\") or blaming others.",
      ru: "Ненастоящая неудача («4 вместо 5 за четверть») или перекладывание вины на других.",
    },
    start: "I ran for student council president and lost by 60 votes — mostly because I only talked to people I already knew.",
  },
  {
    id: "leadership",
    category: "story",
    regions: ["us", "scholarship"],
    question: "Describe a time you led a group.",
    lookFor: {
      en: "Leadership as helping others do their best, not as a title. What did you decide, and how did people respond?",
      ru: "Лидерство как умение помочь другим работать лучше, а не как должность. Какое решение было за тобой и как на него отреагировали люди?",
    },
    avoid: {
      en: "\"I was the captain, so I told everyone what to do.\"",
      ru: "«Я капитан, поэтому говорю всем, что делать».",
    },
    start: "Our debate team kept losing because two people did all the talking, so I changed how we prepared — everyone had to argue both sides.",
  },
  {
    id: "conflict",
    category: "story",
    regions: ["us", "scholarship"],
    question: "Tell me about a disagreement with a teammate. How did you handle it?",
    lookFor: {
      en: "That you can listen, understand the other side and find a solution — without making the other person the villain.",
      ru: "Что ты умеешь слушать, понимать другую сторону и находить решение, не делая из другого человека злодея.",
    },
    avoid: {
      en: "\"I've never had a conflict\", or a story where you were simply right.",
      ru: "«У меня никогда не было конфликтов» или история, где правда просто на твоей стороне.",
    },
    start: "In our robotics team, Dana and I disagreed about the design for a week — until we tested both and mine turned out slower.",
  },
  {
    id: "proud",
    category: "story",
    regions: ["us", "scholarship"],
    question: "What achievement are you most proud of?",
    lookFor: {
      en: "Why it matters to YOU — the effort behind it is more interesting than the medal.",
      ru: "Почему это важно для ТЕБЯ. Усилия за достижением интереснее самой медали.",
    },
    avoid: {
      en: "Picking the most impressive-sounding award and describing only the result.",
      ru: "Выбрать самую громкую награду и рассказать только о результате.",
    },
    start: "Honestly, not my olympiad medal — it's teaching my grandmother to video-call, which took eleven tries.",
  },
  {
    id: "activity",
    category: "story",
    regions: ["us"],
    question: "Which of your activities means the most to you, and why?",
    lookFor: {
      en: "Depth: how long, how your role grew, and what you'd miss if it disappeared.",
      ru: "Глубина: как долго, как росла твоя роль и чего тебе не хватало бы, если бы этого не стало.",
    },
    avoid: {
      en: "Picking what sounds best rather than what you care about — it shows.",
      ru: "Выбрать то, что звучит солиднее, а не то, что тебе действительно важно. Это заметно.",
    },
    start: "The school newspaper. I joined to fix typos, and three years later I'm the one deciding what goes on the front page.",
  },

  // ── How you think ───────────────────────────────────────────────────────
  {
    id: "changed-mind",
    category: "thinking",
    regions: ["uk", "us"],
    question: "What's something you've changed your mind about?",
    lookFor: {
      en: "Open-mindedness: what you believed, what evidence or experience changed it, and what you think now.",
      ru: "Открытость: какое мнение было раньше, какие факты или опыт это изменили и что ты думаешь теперь.",
    },
    avoid: {
      en: "Something trivial (\"I didn't like olives\") or saying you never change your mind.",
      ru: "Мелочь («раньше не любил оливки») или слова о том, что ты никогда не меняешь мнение.",
    },
    start: "I used to think homework should be banned. Then I tutored a younger student and saw what happened when she stopped practising.",
  },
  {
    id: "beyond-school",
    category: "thinking",
    regions: ["uk"],
    question: "What have you explored in your subject beyond the school syllabus?",
    lookFor: {
      en: "Genuine curiosity: something you read, watched, built or tried on your own — and what you made of it.",
      ru: "Настоящее любопытство: что удалось прочитать, посмотреть, построить или попробовать самостоятельно — и какие из этого выводы.",
    },
    avoid: {
      en: "Naming a famous book to sound clever without being able to discuss it.",
      ru: "Назвать известную книгу ради впечатления и не суметь её обсудить.",
    },
    start: "I got stuck on why bridges in cold places crack, and ended up reading two university lecture notes on thermal expansion.",
  },
  {
    id: "explain-simply",
    category: "thinking",
    regions: ["uk", "scholarship"],
    question: "Explain something from your favourite subject as if I were ten years old.",
    lookFor: {
      en: "That you really understand the idea — and can make it clear with a simple example.",
      ru: "Что ты действительно понимаешь идею и можешь объяснить её на простом примере.",
    },
    avoid: {
      en: "Jargon and definitions. If a ten-year-old wouldn't follow, it didn't work.",
      ru: "Термины и определения. Если десятилетний не поймёт, значит, не получилось.",
    },
    start: "Imagine you and your friends share one pizza, and every time someone new arrives, the slices get smaller — that's inflation.",
  },
  {
    id: "problem",
    category: "thinking",
    regions: ["scholarship", "uk", "us"],
    question: "What problem in your community would you like to solve?",
    lookFor: {
      en: "A real, local problem you understand well, and a first realistic step — not a slogan.",
      ru: "Реальная местная проблема, которую ты хорошо понимаешь, и первый реалистичный шаг, а не лозунг.",
    },
    avoid: {
      en: "\"World hunger\" or \"climate change\" with no connection to your own experience.",
      ru: "«Голод в мире» или «изменение климата» без связи с твоим опытом.",
    },
    start: "In my town the buses stop running at 8 p.m., so students who stay late at school walk home in the dark.",
  },
  {
    id: "news",
    category: "thinking",
    regions: ["uk", "scholarship"],
    question: "Is there a recent development in your field that caught your attention?",
    lookFor: {
      en: "That you follow your field: what happened, why it matters, and your own opinion about it.",
      ru: "Что ты следишь за своей областью: что произошло, почему это важно и какое у тебя мнение.",
    },
    avoid: {
      en: "A headline you can't explain, or only repeating what the article said.",
      ru: "Заголовок, который ты не можешь объяснить, или простой пересказ статьи.",
    },
    start: "Yes — a study on growing rice with half the water. What interests me is whether it would work in southern Kazakhstan's soil.",
  },

  // ── The last minutes ────────────────────────────────────────────────────
  {
    id: "your-questions",
    category: "closing",
    regions: ["us", "uk", "scholarship"],
    question: "Do you have any questions for me?",
    lookFor: {
      en: "Genuine interest: one or two questions you couldn't answer from the website — about their experience, a course, student life.",
      ru: "Настоящий интерес: один-два вопроса, ответ на которые не найти на сайте, — про их опыт, курс, студенческую жизнь.",
    },
    avoid: {
      en: "\"No, thank you\" — or a question the website answers on its first page.",
      ru: "«No, thank you» — или вопрос, ответ на который есть на первой странице сайта.",
    },
    start: "Yes — what surprised you most in your first year there?",
  },
  {
    id: "anything-else",
    category: "closing",
    regions: ["us", "scholarship"],
    question: "Is there anything else you'd like us to know?",
    lookFor: {
      en: "One thing that didn't come up and matters — said in 30 seconds. It's your closing line.",
      ru: "Одна важная вещь, о которой не зашла речь, — за 30 секунд. Это твоя финальная фраза.",
    },
    avoid: {
      en: "Repeating your achievements, or saying \"No\" and leaving the chance unused.",
      ru: "Повторять свои достижения или сказать «No» и упустить шанс.",
    },
    start: "Just one thing — I work part-time at my family's shop, which is why my activities list is short, and it's taught me more about people than any club.",
  },
];

/** How to use the bank — shown above the questions. */
export const METHOD: Localized[] = [
  {
    en: "Answer out loud, not in your head — 1–2 minutes per question. Recording yourself on your phone helps a lot.",
    ru: "Отвечай вслух, а не про себя, — 1–2 минуты на вопрос. Очень помогает записать себя на телефон.",
  },
  {
    en: "Use a simple shape: the situation → what you did → what came of it → what you understood.",
    ru: "Держись простой схемы: ситуация → твои действия → что получилось → какой вывод.",
  },
  {
    en: "Don't memorise answers word for word. Prepare 5–6 stories from your life — they fit most questions.",
    ru: "Не заучивай ответы дословно. Подготовь 5–6 историй из своей жизни — они подойдут к большинству вопросов.",
  },
];

export function questionsIn(category: CategoryKey, region: Region | null): InterviewQuestion[] {
  return QUESTIONS.filter((q) => q.category === category && (!region || q.regions.includes(region)));
}
