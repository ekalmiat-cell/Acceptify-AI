import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { RouteTicket } from "@/components/marketing/route-ticket";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    eyebrow: "How it works",
    header: "Boarding pass · Applicant",
    flight: "ALA → UNI",
    notes: ["only what's real", "one programme", "what to fix"],
    title: "From profile to plan in three steps",
    description: "The point is not just a number. It is knowing what the number is made of, and what to do about it.",
    steps: [
      {
        title: "Applicant profile",
        description:
          "Enter your GPA and test scores, then log the activities, leadership roles, and achievements you already have. Nothing is assumed — an empty field stays empty.",
      },
      {
        title: "Admission analysis",
        description:
          "Pick a university and a field of study. Your profile is weighed against that specific programme's evaluation model and the university's own published requirements.",
      },
      {
        title: "Personalized strategy",
        description:
          "See which categories held the score back, what to work on next, and how your list splits into reach, target, and safe schools.",
      },
    ],
  },
  ru: {
    eyebrow: "Как это работает",
    header: "Посадочный талон · Абитуриент",
    flight: "ALA → ВУЗ",
    notes: ["только правда", "под программу", "что исправить"],
    title: "От профиля к плану за три шага",
    description: "Дело не в одной цифре. Важно понимать, из чего она состоит и что с ней делать.",
    steps: [
      {
        title: "Профиль абитуриента",
        description:
          "Введи GPA и баллы тестов, добавь активности, лидерские роли и достижения, которые уже есть. Ничего не додумывается — пустое поле так и остаётся пустым.",
      },
      {
        title: "Анализ поступления",
        description:
          "Выбери университет и направление. Твой профиль сравнивается с моделью оценки именно этой программы и опубликованными требованиями университета.",
      },
      {
        title: "Личная стратегия",
        description:
          "Смотри, какие категории тянут оценку вниз, над чем работать дальше и как твой список делится на амбициозные, целевые и надёжные варианты.",
      },
    ],
  },
});

export async function HowItWorksSection() {
  const t = copy[await getLocale()];
  const stops = t.steps.map((step, index) => ({ ...step, code: `0${index + 1}`, note: t.notes[index] }));
  return (
    <section id="how-it-works" className="relative scroll-mt-16 bg-mk-bg py-24 sm:py-32">
      <Container className="max-w-6xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-16"
          dark
        />

        <RouteTicket header={t.header} flight={t.flight} stops={stops} />
      </Container>
    </section>
  );
}
