import { Info } from "lucide-react";

import { Container } from "@/components/shared/container";
import { FadeIn } from "@/components/shared/fade-in";
import { EnvelopeLetter } from "@/components/marketing/envelope-letter";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    hello: "Hi there!",
    signature: "— Acceptify & BRO",
    postmark: ["ALMATY", "2027"] as [string, string],
    title: "Know your chances. Build your path.",
    text: "Add your scores, pick a university, and see where you stand — and what to fix before you apply.",
    cta: "Check my chances",
    explore: "Explore universities",
    disclaimer: "Acceptify provides an estimate based on your profile and available university data. It is not an admission guarantee.",
  },
  ru: {
    hello: "Привет!",
    signature: "— Acceptify и BRO",
    postmark: ["АЛМАТЫ", "2027"] as [string, string],
    title: "Узнай свои шансы. Построй свой путь.",
    text: "Добавь баллы, выбери университет и посмотри, где ты сейчас — и что исправить до подачи.",
    cta: "Проверить шансы",
    explore: "Смотреть университеты",
    disclaimer: "Acceptify даёт оценку по твоему профилю и открытым данным университетов. Это не гарантия поступления.",
  },
});

export async function FinalCtaSection() {
  const t = copy[await getLocale()];
  return (
    <section className="relative overflow-hidden bg-mk-bg py-24 sm:py-32">
      <Container className="max-w-6xl">
        <EnvelopeLetter
          hello={t.hello}
          title={t.title}
          text={t.text}
          cta={t.cta}
          explore={t.explore}
          signature={t.signature}
          postmark={t.postmark}
        />

        {/*
          Stated once, plainly, on the page that makes the promise. The same
          wording appears alongside every score inside the app.
        */}
        <FadeIn delay={0.1}>
          <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2.5 text-center text-xs leading-relaxed text-mk-ink/40">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t.disclaimer}</span>
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
