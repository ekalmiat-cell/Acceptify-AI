import { ClipboardList, LineChart, Route } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Applicant Profile",
    description:
      "Enter your GPA and test scores, then log the activities, leadership roles, and achievements you already have. Nothing is assumed — an empty field stays empty.",
  },
  {
    icon: LineChart,
    step: "02",
    title: "Admission Analysis",
    description:
      "Pick a university and a field of study. Your profile is weighed against that specific programme's evaluation model and the university's own published requirements.",
  },
  {
    icon: Route,
    step: "03",
    title: "Personalized Strategy",
    description:
      "See which categories held the score back, what to work on next, and how your list splits into reach, target, and safe schools.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative bg-white py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="How it works"
          title="From profile to plan in three steps"
          description="The point is not just a number. It is knowing what the number is made of, and what to do about it."
          className="mb-16"
        />

        <FadeInStagger className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <FadeInStaggerItem key={step.step}>
              <div className="relative flex h-full flex-col gap-4 rounded-xl border border-[#0b1f3a]/10 bg-[#f7f8fa] p-7">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-[#0b1f3a] text-white">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs font-medium text-[#8590a6]">
                    {step.step}
                  </span>
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#0b1f3a]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#4b5468]">
                  {step.description}
                </p>

                {/* Connector between steps on wide screens — reads as a flow
                    rather than three unrelated cards. */}
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute top-12 -right-2 hidden h-px w-4 bg-[#0b1f3a]/15 md:block"
                  />
                ) : null}
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
