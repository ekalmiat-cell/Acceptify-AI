import { ClipboardList, LineChart, Route } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const ICONS = [ClipboardList, LineChart, Route];

const copy = defineCopy({
  en: {
    eyebrow: "How it works",
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
  const steps = t.steps.map((step, index) => ({ ...step, icon: ICONS[index], step: `0${index + 1}` }));
  return (
    <section id="how-it-works" className="relative scroll-mt-16 bg-mk-bg py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          description={t.description}
          className="mb-16"
          dark
        />

        <FadeInStagger className="grid grid-cols-1 gap-5 md:grid-cols-3" staggerDelay={0.25}>
          {steps.map((step) => (
            <FadeInStaggerItem key={step.step} className="h-full">
              <div className="hover-lift glass-panel group relative flex h-full flex-col gap-4 rounded-2xl p-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-glow-brand transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-sm font-semibold text-mk-ink/30 transition-colors group-hover:text-mk-accent">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-semibold text-mk-ink">{step.title}</h3>
                <p className="text-sm leading-relaxed font-medium text-mk-ink/60">
                  {step.description}
                </p>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
