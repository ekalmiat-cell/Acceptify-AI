"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    steps: [
      "Reading the whole essay like an admissions officer…",
      "Scoring six criteria against the rubric…",
      "Commenting on individual sentences…",
      "Mapping what each paragraph does…",
      "Working out your path to 90+…",
    ],
    title: "Reviewing your essay",
    note: "A careful read takes about 30 seconds. Stay on this page — your draft is saved.",
    evaluating: "Evaluating draft",
  },
  ru: {
    steps: [
      "Читаю эссе целиком, как сотрудник приёмной комиссии…",
      "Оцениваю шесть критериев по рубрике…",
      "Комментирую отдельные предложения…",
      "Разбираю, что делает каждый абзац…",
      "Составляю твой путь к 90+…",
    ],
    title: "Разбираю твоё эссе",
    note: "Внимательное чтение занимает около 30 секунд. Не уходи со страницы — черновик сохранён.",
    evaluating: "Оценка черновика",
  },
});

export function EssayLoadingState() {
  const t = useCopy(copy);
  const STEPS = t.steps;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < copy.en.steps.length - 1 ? prev + 1 : prev));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(95, Math.round(((activeStep + 1) / STEPS.length) * 100));

  return (
    <Card className="mx-auto max-w-2xl border shadow-md my-8">
      <CardContent className="p-8 sm:p-10 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
          <Sparkles className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {t.title}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{t.note}</p>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t.evaluating}</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        <div className="mt-6 space-y-3 text-left max-w-md mx-auto border rounded-xl p-4 bg-muted/20">
          {STEPS.map((step, idx) => {
            const isDone = idx < activeStep;
            const isCurrent = idx === activeStep;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                  isCurrent
                    ? "font-semibold text-primary"
                    : isDone
                    ? "text-muted-foreground"
                    : "text-muted-foreground/40"
                }`}
              >
                {isDone ? (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30 text-xs">
                    {idx + 1}
                  </div>
                )}
                <span>{step}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
