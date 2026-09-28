"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Pause, Play, RotateCcw, Shuffle, TriangleAlert, Quote, Eye } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { defineCopy, plural } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";
import {
  CATEGORIES,
  METHOD,
  QUESTIONS,
  REGIONS,
  questionsIn,
  type InterviewQuestion,
  type Region,
} from "@/lib/interview/questions";
import { cn } from "@/lib/utils";

const ANSWER_SECONDS = 120;

const copy = defineCopy({
  en: {
    method: "How to prepare",
    practice: "Practice round",
    practiceNote: "Get a random question, start the timer and answer out loud. Then compare with the tips.",
    random: "Random question",
    next: "Next question",
    start: "Start",
    pause: "Pause",
    reset: "Reset",
    timeUp: "Time's up — wrap up in one sentence.",
    reveal: "Show tips",
    all: "All",
    lookFor: "What they listen for",
    avoid: "Common mistake",
    opening: "One way to start",
    count: (n: number) => `${n} ${n === 1 ? "question" : "questions"}`,
  },
  ru: {
    method: "Как готовиться",
    practice: "Тренировка",
    practiceNote: "Возьми случайный вопрос, запусти таймер и ответь вслух. Потом сравни с подсказками.",
    random: "Случайный вопрос",
    next: "Следующий вопрос",
    start: "Старт",
    pause: "Пауза",
    reset: "Сначала",
    timeUp: "Время вышло — заверши одной фразой.",
    reveal: "Показать подсказки",
    all: "Все",
    lookFor: "Что хотят услышать",
    avoid: "Частая ошибка",
    opening: "Как можно начать",
    count: (n: number) => `${n} ${plural("ru", n, { one: "вопрос", few: "вопроса", many: "вопросов" })}`,
  },
});

export function InterviewBank() {
  const t = useCopy(copy);
  const locale = useLocale();
  const [region, setRegion] = useState<Region | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{t.method}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3 text-sm">
              {METHOD.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{tip[locale]}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
        <PracticeRound className="xl:col-span-3" />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={region === null} onClick={() => setRegion(null)}>
          {t.all}
        </FilterChip>
        {REGIONS.map((r) => (
          <FilterChip key={r.key} active={region === r.key} onClick={() => setRegion(r.key)}>
            {r.title[locale]}
          </FilterChip>
        ))}
      </div>

      {CATEGORIES.map((category) => {
        const questions = questionsIn(category.key, region);
        if (questions.length === 0) return null;
        return (
          <Card key={category.key}>
            <CardHeader>
              <CardTitle>{category.title[locale]}</CardTitle>
              <CardDescription>{t.count(questions.length)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion multiple>
                {questions.map((q) => (
                  <AccordionItem key={q.id} value={q.id}>
                    <AccordionTrigger className="text-base hover:no-underline">{q.question}</AccordionTrigger>
                    <AccordionContent>
                      <QuestionTips question={q} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function QuestionTips({ question }: { question: InterviewQuestion }) {
  const t = useCopy(copy);
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-3 pt-1">
      <Tip icon={<Lightbulb className="size-4 text-emerald-500" />} label={t.lookFor}>
        {question.lookFor[locale]}
      </Tip>
      <Tip icon={<TriangleAlert className="size-4 text-amber-500" />} label={t.avoid}>
        {question.avoid[locale]}
      </Tip>
      <Tip icon={<Quote className="size-4 text-brand" />} label={t.opening}>
        <span lang="en" className="italic">
          {question.start}
        </span>
      </Tip>
    </div>
  );
}

function Tip({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
        <span>{children}</span>
      </div>
    </div>
  );
}

function PracticeRound({ className }: { className?: string }) {
  const t = useCopy(copy);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [left, setLeft] = useState(ANSWER_SECONDS);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  function draw() {
    const pool = QUESTIONS.filter((q) => q.id !== question?.id);
    setQuestion(pool[Math.floor(Math.random() * pool.length)]);
    setLeft(ANSWER_SECONDS);
    setRunning(false);
    setRevealed(false);
  }

  const minutes = Math.floor(left / 60);
  const seconds = String(left % 60).padStart(2, "0");

  return (
    <Card className={cn("border-brand/30", className)}>
      <CardHeader>
        <CardTitle>{t.practice}</CardTitle>
        <CardDescription>{t.practiceNote}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {question ? (
          <>
            <p lang="en" className="font-heading text-xl font-semibold tracking-tight">
              {question.question}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "font-mono text-2xl font-semibold tabular-nums",
                  left === 0 ? "text-rose-500" : left <= 20 ? "text-amber-500" : "text-foreground",
                )}
              >
                {minutes}:{seconds}
              </span>
              <Button variant="outline" size="sm" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
                {running ? <Pause /> : <Play />}
                {running ? t.pause : t.start}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRunning(false);
                  setLeft(ANSWER_SECONDS);
                }}
              >
                <RotateCcw />
                {t.reset}
              </Button>
            </div>
            {left === 0 ? <p className="text-sm text-rose-500">{t.timeUp}</p> : null}
            {revealed ? (
              <QuestionTips question={question} />
            ) : (
              <Button variant="outline" size="sm" className="w-fit" onClick={() => setRevealed(true)}>
                <Eye />
                {t.reveal}
              </Button>
            )}
            <Button onClick={draw} className="w-fit">
              <Shuffle />
              {t.next}
            </Button>
          </>
        ) : (
          <Button onClick={draw} className="w-fit">
            <Shuffle />
            {t.random}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
