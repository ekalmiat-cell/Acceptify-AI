import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: {
    title: "Know your chances. Build your path.",
    text: "Add your scores, pick a university, and see where you stand — and what to fix before you apply.",
    cta: "Check my chances",
    explore: "Explore universities",
    disclaimer: "Acceptify provides an estimate based on your profile and available university data. It is not an admission guarantee.",
  },
  ru: {
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
    <section className="relative overflow-hidden bg-mk-bg pb-24 sm:pb-32">
      <Container className="max-w-6xl">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-mk-ink/10 bg-mk-surface px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="relative mx-auto max-w-xl text-balance font-heading text-3xl font-semibold text-mk-ink sm:text-4xl">
              {t.title}
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-balance text-mk-ink/60">{t.text}</p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="h-11 bg-gradient-brand px-6 text-white hover:opacity-90"
              >
                {t.cta}
                <ArrowRight />
              </Button>
              <Button
                render={<Link href="#universities" />}
                size="lg"
                variant="outline"
                className="h-11 border-mk-ink/15 bg-transparent px-6 text-mk-ink hover:bg-mk-ink/10"
              >
                {t.explore}
              </Button>
            </div>
          </div>
        </FadeIn>

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
