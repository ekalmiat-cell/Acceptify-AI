import Link from "next/link";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeIn } from "@/components/shared/fade-in";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/data/faq";
import { defineCopy } from "@/lib/i18n/core";
import { getLocale } from "@/lib/i18n/server";

const copy = defineCopy({
  en: { eyebrow: "FAQ", title: "Questions, answered", more: "not here? ask BRO inside" },
  ru: { eyebrow: "Вопросы", title: "Ответы на частые вопросы", more: "нет твоего вопроса? спроси BRO в кабинете" },
});

export async function FaqSection() {
  const locale = await getLocale();
  const t = copy[locale];
  return (
    <section id="faq" className="relative scroll-mt-16 border-y border-mk-ink/5 bg-mk-deep py-24 sm:py-32">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          dark
          className="mb-14"
        />

        {/* A page from a school notebook: a red margin, blue rules, numbers in pen. */}
        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border border-mk-ink/10 bg-mk-surface shadow-[0_18px_40px_-30px_rgba(11,31,58,0.5)]">
            <span aria-hidden="true" className="absolute inset-y-0 left-12 w-px bg-[#e5484d]/45 sm:left-16" />
            <Accordion multiple>
              {faqItems[locale].map((item, index) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="relative border-[#2f6feb]/20 pr-5 pl-16 sm:pr-7 sm:pl-22"
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-3.5 left-0 w-12 text-center font-hand text-2xl leading-none text-[#e5484d] sm:w-16"
                  >
                    {index + 1}.
                  </span>
                  <AccordionTrigger className="py-4 text-base font-semibold text-mk-ink hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 leading-relaxed text-mk-ink/60">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-6 flex justify-end">
          <Link href="/sign-up" className="-rotate-2 font-hand text-2xl text-mk-accent transition-transform hover:-rotate-1">
            {t.more} ↗
          </Link>
        </FadeIn>
      </Container>
    </section>
  );
}
