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

export function FaqSection() {
  return (
    <section id="faq" className="relative bg-[#071326] py-24 sm:py-32">
      <Container className="max-w-3xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          dark
          className="mb-14"
        />

        <FadeIn delay={0.1}>
          <Accordion className="glass-panel rounded-2xl px-6" multiple>
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-white/10"
              >
                <AccordionTrigger className="text-white hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-white/55">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </Container>
    </section>
  );
}
