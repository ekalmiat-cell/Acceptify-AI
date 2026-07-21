import {
  BrainCircuit,
  ListChecks,
  Sparkle,
  Building2,
  Award,
  BellRing,
} from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: BrainCircuit,
    title: "AI-powered predictions",
    description:
      "Every prediction weighs your GPA, test scores, and achievements against real acceptance data — not a generic checklist.",
    span: "lg:col-span-2",
  },
  {
    icon: ListChecks,
    title: "Safe, Target & Reach",
    description:
      "Every university you compare is automatically sorted so your list stays balanced and realistic.",
    span: "",
  },
  {
    icon: Building2,
    title: "500+ universities",
    description:
      "From MIT to Nazarbayev University — rankings, tuition, deadlines, and requirements in one place.",
    span: "",
  },
  {
    icon: Award,
    title: "16 achievement categories",
    description:
      "Academics, language tests, olympiads, research, leadership, MUN, hackathons, sports, arts, and more — fully tracked.",
    span: "lg:col-span-2",
  },
  {
    icon: Sparkle,
    title: "Scholarship matching",
    description:
      "See estimated scholarship coverage for every school alongside your predicted chances.",
    span: "",
  },
  {
    icon: BellRing,
    title: "Deadline tracking",
    description:
      "Application deadlines and decision types surface automatically as you build your list.",
    span: "",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-white py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="Platform"
          title="Everything you need to plan a winning list"
          description="Built to replace the spreadsheet, the forum threads, and the guesswork with one clear picture of your odds."
          className="mb-16"
        />

        <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FadeInStaggerItem key={feature.title} className={feature.span}>
              <div
                className={cn(
                  "group h-full rounded-2xl border border-[#0b1f3a]/10 bg-[#f7f8fa] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#0b1f3a]/15 hover:shadow-xl hover:shadow-[#0b1f3a]/5"
                )}
              >
                <span className="bg-gradient-brand inline-flex size-11 items-center justify-center rounded-xl text-white">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-semibold text-[#0b1f3a]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#4b5468]">
                  {feature.description}
                </p>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
