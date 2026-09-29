import { Gauge, ListChecks, Route } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_CRITERIA } from "@/lib/criteria";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

/**
 * The three questions the product exists to answer, in the order a student
 * asks them. Supporting bullets are deliberately concrete and countable —
 * every figure here comes from the real catalogs, not from marketing.
 */
const ICONS = [Gauge, ListChecks, Route];

const copy = defineCopy({
  en: {
    eyebrow: "What you get",
    title: "Three answers, not one number",
    description: "A percentage on its own changes nothing. Acceptify shows where you stand, why, and what moves the needle next.",
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
  const features = t.features.map((feature, index) => ({ ...feature, icon: ICONS[index] }));
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

        <FadeInStagger className="grid grid-cols-1 gap-5 lg:grid-cols-3" staggerDelay={0.2}>
          {features.map((feature) => (
            <FadeInStaggerItem key={feature.title} className="h-full">
              <div className="hover-lift glass-panel group flex h-full flex-col rounded-2xl p-7">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow-brand transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <feature.icon className="size-5" />
                </span>
                <p className="mt-5 text-xs font-semibold tracking-wide text-mk-accent uppercase">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-1.5 font-heading text-xl font-semibold text-mk-ink">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed font-medium text-mk-ink/60">
                  {feature.description}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-mk-ink/10 pt-5">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-sm leading-relaxed text-mk-ink/70"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#4a8bff]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
