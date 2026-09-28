/**
 * How the essay rubric is named in the interface. The rubric itself
 * (lib/essay-rubric.ts) stays in English — it is also the AI's instructions —
 * so its labels are translated here, for display only. Pure.
 */

import type { CriterionKey, ScoreCap } from "@/lib/essay-rubric";
import { READINESS } from "@/lib/essay-rubric";
import type { Locale } from "@/lib/i18n/core";

const CRITERION_NAMES: Record<CriterionKey, Record<Locale, { label: string; short: string; measures: string }>> = {
  reflection: {
    en: {
      label: "Reflection and insight",
      short: "Reflection",
      measures: "What the writer understood about themselves — the 'so what' of the story.",
    },
    ru: {
      label: "Рефлексия и выводы",
      short: "Рефлексия",
      measures: "Что автор понял о себе — зачем вообще эта история.",
    },
  },
  specificity: {
    en: {
      label: "Specific story and detail",
      short: "Specific story",
      measures: "Concrete scenes, actions, numbers and names that show rather than tell.",
    },
    ru: {
      label: "Конкретная история и детали",
      short: "Конкретика",
      measures: "Конкретные сцены, действия, цифры и имена, которые показывают, а не рассказывают.",
    },
  },
  voice: {
    en: {
      label: "Voice and authenticity",
      short: "Voice",
      measures: "Whether it sounds like a real, thoughtful teenager — distinct, honest, not performed.",
    },
    ru: {
      label: "Голос и искренность",
      short: "Голос",
      measures: "Звучит ли текст как настоящий вдумчивый подросток — узнаваемо, честно, без позы.",
    },
  },
  structure: {
    en: {
      label: "Structure and flow",
      short: "Structure",
      measures: "A clear arc: an opening that pulls in, paragraphs that build, an ending that lands.",
    },
    ru: {
      label: "Структура и связность",
      short: "Структура",
      measures: "Понятная линия: цепляющее начало, абзацы, которые развивают мысль, и сильная концовка.",
    },
  },
  prompt: {
    en: {
      label: "Answers the question",
      short: "Answers question",
      measures: "Whether every part of the essay question is answered directly.",
    },
    ru: {
      label: "Ответ на вопрос",
      short: "Ответ на вопрос",
      measures: "Отвечает ли эссе прямо на каждую часть вопроса.",
    },
  },
  language: {
    en: {
      label: "Language and mechanics",
      short: "Language",
      measures: "Grammar, clarity and concision of the English.",
    },
    ru: {
      label: "Язык и грамотность",
      short: "Язык",
      measures: "Грамматика, ясность и лаконичность английского.",
    },
  },
};

export function criterionLabel(key: CriterionKey, locale: Locale): string {
  return CRITERION_NAMES[key][locale].label;
}

export function criterionShort(key: CriterionKey, locale: Locale): string {
  return CRITERION_NAMES[key][locale].short;
}

export function criterionMeasures(key: CriterionKey, locale: Locale): string {
  return CRITERION_NAMES[key][locale].measures;
}

const READINESS_RU: Record<(typeof READINESS)[number]["label"], string> = {
  "Ready to submit": "Можно подавать",
  "Strong — polish it": "Сильно — осталось отшлифовать",
  "Solid draft": "Крепкий черновик",
  "Needs revision": "Нужна доработка",
  "Early draft": "Ранний черновик",
};

export function readinessLabel(label: (typeof READINESS)[number]["label"], locale: Locale): string {
  return locale === "ru" ? READINESS_RU[label] : label;
}

/** A score cap's reason, shown in the interface language (saved reviews store English). */
export function capReason(cap: ScoreCap, locale: Locale): string {
  if (locale === "en") return cap.reason;
  switch (cap.max) {
    case 60:
      return "Эссе не отвечает прямо на вопрос.";
    case 65:
      return "Нет вывода: что тебе стало понятно и что в тебе изменилось.";
    case 70:
      return "Нет конкретного момента или истории, которую можно представить.";
    default:
      return cap.reason;
  }
}
