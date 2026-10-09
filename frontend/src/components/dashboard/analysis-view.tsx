"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2, Download, Loader2, Sparkles, TriangleAlert, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchBadge } from "@/components/shared/match-badge";
import { WhatIfPanel } from "@/components/dashboard/what-if-panel";
import { AcceptedStamp } from "@/components/dashboard/acceptance/accepted-stamp";
import { FlightOverlay } from "@/components/dashboard/acceptance/flight-overlay";
import { ALMATY, cityName, placeOf, type LonLat } from "@/lib/geo";
import { computeAdmissionAnalysis } from "@/lib/scoring";
import type { StudentProfileInput } from "@/lib/predict";
import type { CriterionWeights } from "@/lib/predict";
import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import { createPrediction } from "@/lib/predictions-client";
import { downloadAdmissionReport } from "@/lib/pdf-report";
import { groupUniversitiesByCountry } from "@/lib/universities";
import { fetchEvaluationProfile, fetchPrograms } from "@/lib/programs-client";
import type { Program, University } from "@/types/domain";
import { describeApiError } from "@/lib/api-error";
import { fieldName } from "@/lib/catalog-copy";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";

const copy = defineCopy({
  en: {
    loadFailed: "Could not load this university's programmes. Showing the default model.",
    saved: "Report saved to your prediction history",
    saveFailed: "Could not save this report.",
    baseline: "Simulating baseline analysis",
    baselineNote:
      "Your profile has no saved academic scores yet. You can explore universities, program criteria, and use the What-If simulator below to test different GPA and test scores.",
    fill: "Fill profile",
    country: "1. Country",
    university: "2. University",
    field: "3. Field of study",
    dream: " (Dream)",
    download: "Download report (PDF)",
    save: "Save report",
    model: (name: string) => `${name} evaluation model`,
    confidence: "Confidence",
    breakdown: "Score breakdown",
    breakdownNote: "How your fit score is calculated",
    weight: (n: number) => `${n}% weight`,
    notAssessed: "Not assessed",
    notWeighted: "This programme does not weight this component.",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    noWeaknesses: "No significant weaknesses detected.",
    recommendations: "Recommendations",
    title: "Admission analysis",
    subtitle: "A rule-based breakdown of how well your profile fits any university on the platform.",
    fitScore: "fit score / 100",
  },
  ru: {
    loadFailed: "Не удалось загрузить программы университета. Показываем модель по умолчанию.",
    saved: "Отчёт сохранён в историю прогнозов",
    saveFailed: "Не удалось сохранить отчёт.",
    baseline: "Базовый анализ без профиля",
    baselineNote:
      "В профиле пока нет академических баллов. Можно смотреть университеты и критерии программ, а симулятор «что если» ниже поможет проверить разные GPA и результаты тестов.",
    fill: "Заполнить профиль",
    country: "1. Страна",
    university: "2. Университет",
    field: "3. Направление",
    dream: " (мечта)",
    download: "Скачать отчёт (PDF, на английском)",
    save: "Сохранить отчёт",
    model: (name: string) => `Модель оценки: ${name}`,
    confidence: "Уверенность",
    breakdown: "Из чего складывается оценка",
    breakdownNote: "Как считается твой балл соответствия",
    weight: (n: number) => `вес ${n}%`,
    notAssessed: "Не оценивается",
    notWeighted: "Эта программа не учитывает этот компонент.",
    strengths: "Сильные стороны",
    weaknesses: "Слабые места",
    noWeaknesses: "Серьёзных слабых мест не найдено.",
    recommendations: "Рекомендации",
    title: "Анализ поступления",
    subtitle: "Разбор по правилам: насколько твой профиль подходит любому университету на платформе.",
    fitScore: "соответствие / 100",
  },
});

type Copy = (typeof copy)["en"];

/** A fit score above this earns the "accepted" stamp and the flight. */
const ACCEPTED_SCORE = 75;
/** Closer to Almaty than this (degrees), there is no flight worth showing. */
const SAME_CITY_DEGREES = 1.5;

interface Flight {
  to: LonLat;
  city: string;
  universityName: string;
}

/** The flight to a university, or null when it is in or next to Almaty. */
function flightTo(university: University): Flight | null {
  const to = placeOf(university.country, university.city);
  if (!to || Math.hypot(to[0] - ALMATY[0], to[1] - ALMATY[1]) < SAME_CITY_DEGREES) return null;
  return { to, city: cityName(university.city), universityName: university.name };
}

export function AnalysisView({
  studentName,
  studentEmail,
  universities,
  profile,
  profileCompleteness,
  dreamUniversityId,
  dreamProgramId,
  declaredField,
  initialUniversityId,
}: {
  studentName: string;
  studentEmail: string;
  universities: University[];
  profile: StudentProfileInput | null;
  profileCompleteness: number;
  dreamUniversityId: string | null;
  dreamProgramId: string | null;
  /** The student's intended field of study. Used to pick the same
   * programme's evaluation model that every other screen scores them
   * against — see lib/weights-server.ts. */
  declaredField: string | null;
  initialUniversityId?: string | null;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const byCountry = useMemo(() => groupUniversitiesByCountry(universities), [universities]);

  const targetUniv = initialUniversityId
    ? universities.find((u) => u.id === initialUniversityId || u.slug === initialUniversityId)
    : null;
  const defaultId = targetUniv?.id ?? dreamUniversityId ?? universities[0]?.id ?? "";
  const defaultCountry = targetUniv?.country ?? universities.find((u) => u.id === defaultId)?.country ?? "";
  const [country, setCountry] = useState(defaultCountry);
  const [universityId, setUniversityId] = useState(defaultId);
  const [isSaving, setIsSaving] = useState(false);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [programId, setProgramId] = useState("");
  const [weights, setWeights] = useState<CriterionWeights>(DEFAULT_WEIGHTS);
  /** The evaluation model loads after mount. Without this the page rendered
   * a score computed from the default weights and then silently replaced it
   * with a different number once the programme's weights arrived. */
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  const universitiesInCountry = byCountry.find((g) => g.country === country)?.universities ?? [];
  const university = universities.find((u) => u.id === universityId) ?? null;
  const activeProgram = programs.find((p) => p.id === programId) ?? null;

  function handleCountryChange(next: string) {
    setCountry(next);
    setUniversityId("");
  }

  useEffect(() => {
    let cancelled = false;
    if (!universityId) {
      setPrograms([]);
      setProgramId("");
      return;
    }

    setIsLoadingModel(true);
    fetchPrograms(universityId)
      .then((list) => {
        if (cancelled) return;
        setPrograms(list);
        /**
         * Prefer the programme matching the student's declared field of
         * study. Falling back to `list[0]` — whichever programme happens to
         * sort first — used to mean opening a university you hadn't declared
         * a field for silently scored you against an unrelated model.
         */
        const declared =
          list.find((p) => p.id === dreamProgramId) ??
          (declaredField ? list.find((p) => p.field === declaredField) : undefined);
        setProgramId(declared?.id ?? "");
      })
      .catch(() => {
        // An unreachable API used to surface as an unhandled rejection.
        if (cancelled) return;
        setPrograms([]);
        setProgramId("");
        toast.error(t.loadFailed);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModel(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the toast text doesn't change what is loaded
  }, [universityId, dreamProgramId, declaredField]);

  useEffect(() => {
    let cancelled = false;
    if (!programId) {
      setWeights(DEFAULT_WEIGHTS);
      return;
    }

    setIsLoadingModel(true);
    fetchEvaluationProfile(programId)
      .then((evaluationProfile) => {
        if (cancelled) return;
        if (!evaluationProfile) {
          setWeights(DEFAULT_WEIGHTS);
          return;
        }
        const map: CriterionWeights = {};
        for (const entry of evaluationProfile.weights) {
          map[entry.criterionKey as keyof CriterionWeights] = entry.weight;
        }
        setWeights(map);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModel(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  const effectiveProfile: StudentProfileInput = useMemo(
    () =>
      profile ?? {
        gpa: null,
        satScore: null,
        actScore: null,
        ieltsScore: null,
        toeflScore: null,
        entScore: null,
        achievements: {},
      },
    [profile]
  );

  const analysis = useMemo(() => {
    if (!university) return null;
    return computeAdmissionAnalysis(university, effectiveProfile, profileCompleteness, weights, locale);
  }, [effectiveProfile, university, profileCompleteness, weights, locale]);

  const accepted = !isLoadingModel && analysis !== null && analysis.score > ACCEPTED_SCORE;
  const resultKey = university ? `${university.id}:${programId}` : "";
  /** The result whose stamp should come down hard (only the first time it is earned). */
  const [slamKey, setSlamKey] = useState<string | null>(null);
  const [flight, setFlight] = useState<Flight | null>(null);

  // A result earns the celebration once per browser session: the stamp
  // slams, and a beat later the plane takes off.
  useEffect(() => {
    if (!accepted || !university) return;
    const seenKey = `acceptify-accepted:${resultKey}`;
    try {
      if (sessionStorage.getItem(seenKey) === "1") return;
      sessionStorage.setItem(seenKey, "1");
    } catch {}
    setSlamKey(resultKey);
    const next = flightTo(university);
    if (!next || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const takeOff = window.setTimeout(() => setFlight(next), 1100);
    return () => window.clearTimeout(takeOff);
  }, [accepted, resultKey, university]);

  function replayFlight() {
    if (university) setFlight(flightTo(university));
  }

  async function handleSaveReport() {
    if (!analysis || !university) return;
    setIsSaving(true);
    try {
      await createPrediction({
        universityId: university.id,
        matchScore: analysis.score,
        category: analysis.category,
      });
      toast.success(t.saved);
    } catch (error) {
      toast.error(describeApiError(error, t.saveFailed));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDownloadPdf() {
    if (!analysis || !university) return;
    // The PDF's built-in font has no Cyrillic, so the report is always English.
    downloadAdmissionReport({
      studentName,
      studentEmail,
      universityName: university.name,
      analysis: computeAdmissionAnalysis(university, effectiveProfile, profileCompleteness, weights, "en"),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader t={t} />

      {!profile && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{t.baseline}</p>
              <p className="text-xs text-muted-foreground">{t.baselineNote}</p>
            </div>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" variant="outline" className="shrink-0">
            {t.fill}
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:max-w-2xl sm:flex-row">
            <Select value={country} onValueChange={(v) => handleCountryChange(v as string)}>
              <SelectTrigger className="w-full sm:max-w-44">
                <SelectValue placeholder={t.country}>
                  {(value: string) => (value ? countryName(value, locale) : t.country)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {byCountry.map((g) => (
                  <SelectItem key={g.country} value={g.country}>
                    {countryName(g.country, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={universityId}
              onValueChange={(v) => setUniversityId(v as string)}
              disabled={!country}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.university}>
                  {(value: string) => universities.find((u) => u.id === value)?.name ?? t.university}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {universitiesInCountry.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === dreamUniversityId ? t.dream : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={programId}
              onValueChange={(v) => setProgramId(v as string)}
              disabled={programs.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.field}>
                  {(value: string) => {
                    const program = programs.find((p) => p.id === value);
                    return program ? fieldName(program.name, locale) : t.field;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {fieldName(p.name, locale)}
                    {p.id === dreamProgramId ? t.dream : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={!analysis}>
              <Download />
              {t.download}
            </Button>
            <Button onClick={handleSaveReport} disabled={!analysis || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              {t.save}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoadingModel ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Skeleton className="h-64 xl:col-span-1" />
          <Skeleton className="h-64 xl:col-span-2" />
        </div>
      ) : null}

      {!isLoadingModel && analysis && university ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="relative flex flex-col items-center justify-center gap-4 overflow-visible py-8 xl:col-span-1">
              {accepted ? (
                <AcceptedStamp
                  key={resultKey}
                  slam={slamKey === resultKey}
                  onClick={replayFlight}
                  className="absolute bottom-16 right-5 z-10"
                />
              ) : null}
              <ScoreCircle t={t} score={analysis.score} />
              <div className="flex flex-col items-center gap-1">
                <p className="font-heading text-lg font-semibold text-foreground">{university.name}</p>
                {activeProgram ? (
                  <p className="text-xs text-muted-foreground">{t.model(fieldName(activeProgram.name, locale))}</p>
                ) : null}
                <MatchBadge category={analysis.category} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {t.confidence}
                <span className="font-mono font-medium text-foreground">{analysis.confidence}%</span>
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>{t.breakdown}</CardTitle>
                <CardDescription>{t.breakdownNote}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {analysis.breakdown.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{t.weight(item.weight)}</span>
                    </div>
                    {item.score == null ? (
                      <>
                        <p className="mt-2 font-heading text-lg font-medium text-muted-foreground">
                          {t.notAssessed}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t.notWeighted}</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                          {item.score}%
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-brand"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Keyed on the evaluation model: switching university or programme
              starts a fresh hypothetical rather than carrying one student's
              what-if over to a programme that weights it differently. */}
          <WhatIfPanel
            key={`${university.id}:${programId}`}
            university={university}
            profile={effectiveProfile}
            weights={weights}
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <InsightCard
              icon={CheckCircle2}
              accent="emerald"
              title={t.strengths}
              items={analysis.strengths}
            />
            <InsightCard
              icon={TriangleAlert}
              accent="rose"
              title={t.weaknesses}
              items={analysis.weaknesses}
              emptyText={t.noWeaknesses}
            />
            <InsightCard
              icon={Lightbulb}
              accent="amber"
              title={t.recommendations}
              items={analysis.recommendations}
            />
          </div>
        </>
      ) : null}

      <AnimatePresence>
        {flight ? (
          <FlightOverlay
            key={flight.universityName}
            to={flight.to}
            city={flight.city}
            universityName={flight.universityName}
            onDone={() => setFlight(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PageHeader({ t }: { t: Copy }) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.title}</h1>
      <p className="text-sm text-muted-foreground">{t.subtitle}</p>
    </div>
  );
}

function ScoreCircle({ t, score }: { t: Copy; score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative flex size-36 items-center justify-center">
      <svg viewBox="0 0 128 128" className="size-36 -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--muted)" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--color-brand)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-heading text-3xl font-semibold text-foreground">{score}</span>
        {/* Not "chance": this is a fit score out of 100, and labelling it as a
            probability is the one claim the engine cannot support. See
            `MatchResult.score` in lib/predict.ts. */}
        <span className="text-xs text-muted-foreground">{t.fitScore}</span>
      </div>
    </div>
  );
}

const insightAccent = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const;

function InsightCard({
  icon: Icon,
  accent,
  title,
  items,
  emptyText,
}: {
  icon: typeof CheckCircle2;
  accent: keyof typeof insightAccent;
  title: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className={`flex size-7 items-center justify-center rounded-lg ${insightAccent[accent]}`}>
            <Icon className="size-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}
