"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { FadeIn } from "@/components/shared/fade-in";
import { MatchBadge } from "@/components/shared/match-badge";
import { Slider } from "@/components/ui/slider";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { predictMatch } from "@/lib/predict";
import type { University } from "@/types/domain";

const demoUniversityIds = ["uni-mit", "uni-toronto", "uni-nu", "uni-eth"];

export function AiDemoSection({ universities }: { universities: University[] }) {
  const [gpa, setGpa] = useState(3.6);
  const [sat, setSat] = useState(1380);
  const [ielts, setIelts] = useState(7.0);

  const results = useMemo(() => {
    return demoUniversityIds
      .map((id) => universities.find((u) => u.id === id))
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((university) => ({
        university,
        ...predictMatch(university, {
          gpa,
          satScore: sat,
          actScore: null,
          ieltsScore: ielts,
          toeflScore: null,
          entScore: null,
          activitiesRatio: 0.5,
          leadershipRatio: 0.5,
          achievementsRatio: 0.5,
        }),
      }))
      .sort((a, b) => b.score - a.score);
  }, [universities, gpa, sat, ielts]);

  return (
    <section id="ai-demo" className="relative bg-[#071326] py-24 sm:py-32">
      <div className="bg-grid-glow pointer-events-none absolute inset-0 opacity-60" />
      <Container className="relative max-w-7xl">
        <SectionHeading
          eyebrow="Live demo"
          title="Try the prediction engine yourself"
          description="Drag the sliders to match your profile and watch match scores update in real time — this is the same engine behind your dashboard."
          dark
          className="mb-16"
        />

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <FadeIn className="glass-panel flex flex-col gap-8 rounded-3xl p-8">
            <DemoSlider
              label="GPA"
              value={gpa}
              onChange={setGpa}
              min={2.0}
              max={4.0}
              step={0.05}
              format={(v) => v.toFixed(2)}
            />
            <DemoSlider
              label="SAT score"
              value={sat}
              onChange={setSat}
              min={900}
              max={1600}
              step={10}
              format={(v) => Math.round(v).toString()}
            />
            <DemoSlider
              label="IELTS band"
              value={ielts}
              onChange={setIelts}
              min={5.0}
              max={9.0}
              step={0.5}
              format={(v) => v.toFixed(1)}
            />

            <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 text-sm text-white/60">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
              Scores update instantly using the same weighting as your full
              dashboard: academics, test scores, and achievement breadth.
            </div>
          </FadeIn>

          <FadeIn delay={0.1} className="flex flex-col gap-3">
            {results.map(({ university, score, category }) => (
              <div
                key={university.id}
                className="glass-panel flex items-center gap-4 rounded-2xl p-5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-white">
                  {university.logoInitials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium text-white">
                      {university.name}
                    </p>
                    <span className="shrink-0 font-heading text-lg font-semibold text-white">
                      {score}%
                    </span>
                  </div>
                  <Progress value={score} className="mt-2">
                    <ProgressTrack className="bg-white/10">
                      <ProgressIndicator className="bg-gradient-brand" />
                    </ProgressTrack>
                  </Progress>
                </div>
                <MatchBadge category={category} className="shrink-0" />
              </div>
            ))}
          </FadeIn>
        </div>
      </Container>
    </section>
  );
}

function DemoSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white">{label}</span>
        <span className="font-mono text-white/60">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}
