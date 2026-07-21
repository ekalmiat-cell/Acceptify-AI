import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#071326] pb-24 sm:pb-32">
      <Container className="max-w-6xl">
        <FadeIn>
          <div className="bg-gradient-brand relative overflow-hidden rounded-3xl px-8 py-16 text-center sm:px-16 sm:py-20">
            <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-white/10 blur-3xl" />
            <h2 className="relative mx-auto max-w-xl text-balance font-heading text-3xl font-semibold text-white sm:text-4xl">
              Stop guessing. Start applying with data on your side.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-balance text-white/80">
              Free to start — get your first prediction in under two minutes.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="h-11 bg-white px-6 text-[#0b1f3a] hover:bg-white/90"
              >
                Get started free
                <ArrowRight />
              </Button>
              <Button
                render={<Link href="/pricing" />}
                size="lg"
                variant="outline"
                className="h-11 border-white/30 bg-transparent px-6 text-white hover:bg-white/10"
              >
                View pricing
              </Button>
            </div>
          </div>
        </FadeIn>
      </Container>
    </section>
  );
}
