"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { MatchBadge } from "@/components/shared/match-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { describeApiError } from "@/lib/api-error";
import { fetchChance, type ChanceResponse } from "@/lib/chance-client";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import type { ChanceConfidence } from "@/types/chance";

const copy = defineCopy({
  en: {
    title: "AI chance estimate",
    description: "An AI reads your profile against this university's numbers. An estimate, not a promise.",
    ask: "Estimate with AI",
    again: (left: number) => `${left} left today`,
    noneLeft: "You've used today's estimates. They refill tomorrow.",
    chance: "chance of admission",
    confidence: (level: ChanceConfidence) =>
      ({ low: "Low confidence", medium: "Medium confidence", high: "High confidence" })[level],
    positives: "What helps",
    negatives: "What holds it back",
    formula: (percent: number) => `The plain formula says ${percent}%.`,
    fromFormula: "The AI couldn't be asked, so this comes from the plain formula.",
    limit: "You've used today's AI estimates, so this comes from the plain formula.",
    adjusted: "The AI's number was moved into a realistic range for this university's selectivity.",
    failed: "Could not get the estimate.",
    fillProfile: "Add a score to your profile to get an estimate.",
  },
  ru: {
    title: "Оценка шанса от ИИ",
    description: "ИИ сверяет твой профиль с цифрами этого вуза. Это оценка, а не обещание.",
    ask: "Оценить с ИИ",
    again: (left: number) => `Осталось сегодня: ${left}`,
    noneLeft: "Оценки на сегодня закончились. Завтра они обновятся.",
    chance: "шанс поступления",
    confidence: (level: ChanceConfidence) =>
      ({ low: "Уверенность низкая", medium: "Уверенность средняя", high: "Уверенность высокая" })[level],
    positives: "Что помогает",
    negatives: "Что мешает",
    formula: (percent: number) => `Простая формула даёт ${percent}%.`,
    fromFormula: "ИИ сейчас недоступен, поэтому это расчёт по простой формуле.",
    limit: "Оценки ИИ на сегодня закончились, поэтому это расчёт по простой формуле.",
    adjusted: "Число от ИИ приведено к реалистичному диапазону для такой селективности вуза.",
    failed: "Не удалось получить оценку.",
    fillProfile: "Добавь в профиль хотя бы один балл, чтобы получить оценку.",
  },
});

export function ChanceCard({
  universityId,
  programId = null,
  hasProfile,
}: {
  universityId: string;
  programId?: string | null;
  hasProfile: boolean;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const [response, setResponse] = useState<ChanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(hasProfile);

  // Looking is free: show an estimate someone already made, and only offer
  // to spend a model call when there is none.
  useEffect(() => {
    if (!hasProfile) return;
    let cancelled = false;
    setResponse(null);
    setChecking(true);
    fetchChance({ universityId, programId, cacheOnly: true })
      .then((result) => {
        if (!cancelled) setResponse(result);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universityId, programId, hasProfile, locale]);

  async function ask() {
    setLoading(true);
    try {
      setResponse(await fetchChance({ universityId, programId }));
    } catch (error) {
      toast.error(describeApiError(error, t.failed));
    } finally {
      setLoading(false);
    }
  }

  const estimate = response?.estimate ?? null;
  const left = response?.left ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          {t.title}
        </CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!hasProfile ? (
          <p className="text-sm text-muted-foreground">{t.fillProfile}</p>
        ) : checking ? (
          <Skeleton className="h-24" />
        ) : estimate ? (
          <>
            <div className="flex flex-wrap items-center gap-4">
              <p className="font-heading text-4xl font-semibold text-foreground">
                {estimate.probability}%
                <span className="ml-2 text-sm font-normal text-muted-foreground">{t.chance}</span>
              </p>
              <MatchBadge category={estimate.category} />
              <span className="text-xs text-muted-foreground">{t.confidence(estimate.confidence)}</span>
            </div>
            {estimate.summary ? <p className="text-sm text-foreground">{estimate.summary}</p> : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReasonList icon={CheckCircle2} tone="text-emerald-600 dark:text-emerald-400" title={t.positives} items={estimate.positives} />
              <ReasonList icon={TriangleAlert} tone="text-rose-600 dark:text-rose-400" title={t.negatives} items={estimate.negatives} />
            </div>
            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
              {estimate.source === "math" ? (
                <p>{response?.notice === "limit" ? t.limit : t.fromFormula}</p>
              ) : (
                <>
                  <p>{t.formula(estimate.math.probability)}</p>
                  {estimate.adjusted ? <p>{t.adjusted}</p> : null}
                </>
              )}
            </div>
          </>
        ) : null}

        {hasProfile && !checking && (!estimate || estimate.source === "math") ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={ask} disabled={loading || left === 0}>
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {t.ask}
            </Button>
            {left === 0 ? (
              <span className="text-xs text-muted-foreground">{t.noneLeft}</span>
            ) : left !== null ? (
              <span className="text-xs text-muted-foreground">{t.again(left)}</span>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReasonList({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: typeof CheckCircle2;
  tone: string;
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className={`flex items-center gap-1.5 text-sm font-medium ${tone}`}>
        <Icon className="size-4" />
        {title}
      </p>
      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
