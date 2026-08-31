import { Gauge, ListChecks, Route } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_CRITERIA } from "@/lib/criteria";

/**
 * The three questions the product exists to answer, in the order a student
 * asks them. Supporting bullets are deliberately concrete and countable —
 * every figure here comes from the real catalogs, not from marketing.
 */
const features = [
  {
    icon: Gauge,
    eyebrow: "Where do I stand?",
    title: "Admission Analysis",
    description:
      "A fit score for one university and one programme, plus a reach / target / safe classification — not a single generic score reused everywhere.",
    points: [
      `${ACADEMIC_CRITERIA.length} academic inputs and ${achievementCatalog.length} achievement categories`,
      "Weighted by the programme you actually intend to apply for",
      "Adjusted for how selective that university is",
    ],
  },
  {
    icon: ListChecks,
    eyebrow: "Why?",
    title: "Score Breakdown",
    description:
      "Academic strength, activities, leadership, and achievements are scored separately, so you can see which part of the application carried the number and which part dragged it down.",
    points: [
      "Strengths and weaknesses drawn from your own entries",
      "A requirements gap against the university's stated bar",
      "Every weight visible — nothing hidden behind a black box",
    ],
  },
  {
    icon: Route,
    eyebrow: "What should I do next?",
    title: "Personalized Strategy",
    description:
      "The gaps become an ordered list of what to work on, and your shortlist gets balanced across reach, target, and safe schools.",
    points: [
      "A single next best action, based on your weakest category",
      "A balanced university list instead of a wish list",
      "A downloadable report you can share with a counsellor",
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#f7f8fa] py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="What you get"
          title="Three answers, not one number"
          description="A percentage on its own changes nothing. Acceptify shows where you stand, why, and what moves the needle next."
          className="mb-16"
        />

        <FadeInStagger className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <FadeInStaggerItem key={feature.title}>
              <div className="flex h-full flex-col rounded-xl border border-[#0b1f3a]/10 bg-white p-7 transition-shadow duration-300 hover:shadow-lg hover:shadow-[#0b1f3a]/5">
                <span className="inline-flex size-11 items-center justify-center rounded-lg bg-[#0b1f3a] text-white">
                  <feature.icon className="size-5" />
                </span>
                <p className="mt-5 text-xs font-medium tracking-wide text-[#2f6feb] uppercase">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-1.5 font-heading text-lg font-semibold text-[#0b1f3a]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4b5468]">
                  {feature.description}
                </p>
                <ul className="mt-5 flex flex-col gap-2.5 border-t border-[#0b1f3a]/10 pt-5">
                  {feature.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-sm leading-relaxed text-[#4b5468]"
                    >
                      <span className="mt-2 size-1 shrink-0 rounded-full bg-[#2f6feb]" />
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
