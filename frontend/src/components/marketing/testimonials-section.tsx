import { Star } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeInStagger, FadeInStaggerItem } from "@/components/shared/fade-in";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { testimonials } from "@/data/testimonials";

export function TestimonialsSection() {
  return (
    <section className="relative bg-[#f7f8fa] py-24 sm:py-32">
      <Container className="max-w-7xl">
        <SectionHeading
          eyebrow="Success stories"
          title="Students who planned smarter, not harder"
          className="mb-16"
        />

        <FadeInStagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <FadeInStaggerItem key={t.id}>
              <div className="flex h-full flex-col gap-5 rounded-2xl border border-[#0b1f3a]/10 bg-white p-6">
                <div className="flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-current" />
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-[#3a4358]">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-[#0b1f3a]/10 pt-4">
                  <Avatar>
                    <AvatarFallback className="bg-[#0b1f3a] text-white">
                      {t.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-[#0b1f3a]">{t.name}</p>
                    <p className="text-xs text-[#8590a6]">{t.university}</p>
                  </div>
                </div>
              </div>
            </FadeInStaggerItem>
          ))}
        </FadeInStagger>
      </Container>
    </section>
  );
}
