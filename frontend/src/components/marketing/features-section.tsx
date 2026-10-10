import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { AnswerSheets } from "@/components/marketing/answer-sheets";
import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_CRITERIA } from "@/lib/criteria";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

/**
 * The three questions the product exists to answer, in the order a student
 * asks them. Supporting bullets are deliberately concrete and countable —
 * every figure here comes from the real catalogs, not from marketing. The
 * samples on top of each sheet are labelled as examples.
 */

const copy = defineCopy({
  en: {
    eyebrow: "What you get",
    title: "Three answers, not one number",
    description: "A percentage on its own changes nothing. Acceptify shows where you stand, why, and what moves the needle next.",
    examples: {
      example: "example",
      score: { programme: "NU · Computer Science", category: "Target" },
      breakdown: {
        rows: [["Academics", 84], ["Activities", 61], ["Leadership", 38], ["Achievements", 70]] as [string, number][],
        weakest: "holds you back",
      },
      plan: {
        items: [["Sit the SAT", true], ["Essay hook", true], ["Leadership: start a club", false]] as [string, boolean][],
      },
    },
    features: [
      {
        eyebrow: "Where do I stand?",
        title: "Admission analysis",
        description:
          "A fit score for one university and one programme, plus a reach / target / safe classification — not a single generic score reused everywhere.",
        points: [
          `${ACADEMIC_CRITERIA.length} academic inputs and ${achievementCatalog.length} achievement categories`,
          "Weighted by the programme you actually intend to apply for",
          "Adjusted for how selective that university is",
        ],
      },
      {
        eyebrow: "Why?",
        title: "Score breakdown",
        description:
          "Academic strength, activities, leadership, and achievements are scored separately, so you can see which part of the application carried the number and which part dragged it down.",
        points: [
          "Strengths and weaknesses drawn from your own entries",
          "A requirements gap against the university's stated bar",
          "Every weight visible — nothing hidden behind a black box",
        ],
      },
      {
        eyebrow: "What should I do next?",
        title: "Personalized strategy",
        description:
          "The gaps become an ordered list of what to work on, and your shortlist gets balanced across reach, target, and safe schools.",
        points: [
          "A single next best action, based on your weakest category",
          "A balanced university list instead of a wish list",
          "A downloadable report you can share with a counsellor",
        ],
      },
    ],
  },
  ru: {
    eyebrow: "Что ты получишь",
    title: "Три ответа, а не одна цифра",
    description: "Процент сам по себе ничего не меняет. Acceptify показывает, где ты сейчас, почему и что сдвинет результат дальше.",
    examples: {
      example: "пример",
      score: { programme: "NU · Computer Science", category: "Целевой" },
      breakdown: {
        rows: [["Учёба", 84], ["Активности", 61], ["Лидерство", 38], ["Достижения", 70]] as [string, number][],
        weakest: "тянет вниз",
      },
      plan: {
        items: [["Сдать SAT", true], ["Хук для эссе", true], ["Лидерство: свой клуб", false]] as [string, boolean][],
      },
    },
    features: [
      {
        eyebrow: "Где я сейчас?",
        title: "Анализ поступления",
        description:
          "Балл соответствия для одного университета и одной программы плюс категория — амбициозный, целевой или надёжный вариант, — а не одна общая оценка для всех.",
        points: [
          `${ACADEMIC_CRITERIA.length} академических показателей и ${achievementCatalog.length} категорий достижений`,
          "С весами программы, на которую ты правда собираешься подавать",
          "С поправкой на строгость отбора в университете",
        ],
      },
      {
        eyebrow: "Почему?",
        title: "Разбор оценки",
        description:
          "Учёба, активности, лидерство и достижения оцениваются отдельно — видно, какая часть заявки вытянула оценку, а какая потянула вниз.",
        points: [
          "Сильные и слабые стороны — по твоим собственным данным",
          "Разрыв с заявленными требованиями университета",
          "Все веса на виду — никакого чёрного ящика",
        ],
      },
      {
        eyebrow: "Что делать дальше?",
        title: "Личная стратегия",
        description:
          "Пробелы превращаются в упорядоченный список задач, а список университетов балансируется между амбициозными, целевыми и надёжными.",
        points: [
          "Один следующий лучший шаг — по твоей самой слабой категории",
          "Сбалансированный список вузов вместо списка желаний",
          "Отчёт, который можно скачать и показать консультанту",
        ],
      },
    ],
  },
});

export async function FeaturesSection() {
  const t = copy[await getLocale()];
  return (
    <section id="features" className="relative scroll-mt-16 border-y border-mk-ink/5 bg-mk-deep py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-16"
          dark
        />

        <AnswerSheets sheets={t.features} examples={t.examples} />
      </Container>
    </section>
  );
}
