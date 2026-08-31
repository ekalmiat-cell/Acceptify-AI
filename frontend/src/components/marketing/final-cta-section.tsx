import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/shared/fade-in";

export function FinalCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#071326] pb-24 sm:pb-32">
      <Container className="max-w-6xl">
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1c33] px-8 py-16 text-center sm:px-16 sm:py-20">
            <h2 className="relative mx-auto max-w-xl text-balance font-heading text-3xl font-semibold text-white sm:text-4xl">
              Know your chances. Build your path.
            </h2>
            <p className="relative mx-auto mt-4 max-w-md text-balance text-white/60">
              Add your scores, pick a university, and see where you stand — and
              what to fix before you apply.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/sign-up" />}
                size="lg"
                className="h-11 bg-gradient-brand px-6 text-white hover:opacity-90"
              >
                Check My Chances
                <ArrowRight />
              </Button>
              <Button
                render={<Link href="#universities" />}
                size="lg"
                variant="outline"
                className="h-11 border-white/15 bg-transparent px-6 text-white hover:bg-white/10"
              >
                Explore Universities
              </Button>
            </div>
          </div>
        </FadeIn>

        {/*
          Stated once, plainly, on the page that makes the promise. The same
          wording appears alongside every score inside the app.
        */}
        <FadeIn delay={0.1}>
          <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2.5 text-center text-xs leading-relaxed text-white/40">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Acceptify provides an estimate based on your profile and available
              university data. It is not an admission guarantee.
            </span>
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
