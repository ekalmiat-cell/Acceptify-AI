"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { MatchBadge } from "@/components/shared/match-badge";
import { computeAdmissionAnalysis } from "@/lib/scoring";
import type { StudentProfileInput } from "@/lib/predict";
import { createPrediction } from "@/lib/predictions-client";
import { downloadAdmissionReport } from "@/lib/pdf-report";
import { groupUniversitiesByCountry } from "@/lib/universities";
import type { University } from "@/types/domain";

export function AnalysisView({
  studentName,
  studentEmail,
  universities,
  profile,
  profileCompleteness,
  dreamUniversityId,
}: {
  studentName: string;
  studentEmail: string;
  universities: University[];
  profile: StudentProfileInput | null;
  profileCompleteness: number;
  dreamUniversityId: string | null;
}) {
  const byCountry = useMemo(() => groupUniversitiesByCountry(universities), [universities]);

  const defaultId = dreamUniversityId ?? universities[0]?.id ?? "";
  const defaultCountry = universities.find((u) => u.id === defaultId)?.country ?? "";
  const [country, setCountry] = useState(defaultCountry);
  const [universityId, setUniversityId] = useState(defaultId);
  const [isSaving, setIsSaving] = useState(false);

  const universitiesInCountry = byCountry.find((g) => g.country === country)?.universities ?? [];
  const university = universities.find((u) => u.id === universityId) ?? null;

  function handleCountryChange(next: string) {
    setCountry(next);
    setUniversityId("");
  }

  const analysis = useMemo(() => {
    if (!profile || !university) return null;
    return computeAdmissionAnalysis(university, profile, profileCompleteness);
  }, [profile, university, profileCompleteness]);

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Complete your profile first</p>
            <p className="text-xs text-muted-foreground">
              Add at least one academic score (GPA, SAT, IELTS, TOEFL, ACT, or ENT) to run an admission analysis.
            </p>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" className="mt-1">
            Complete your profile
          </Button>
        </div>
      </div>
    );
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
      toast.success("Report saved to your prediction history");
    } catch {
      toast.error("Could not save this report.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleDownloadPdf() {
    if (!analysis || !university) return;
    downloadAdmissionReport({
      studentName,
      studentEmail,
      universityName: university.name,
      analysis,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
            <Select value={country} onValueChange={(v) => handleCountryChange(v as string)}>
              <SelectTrigger className="w-full sm:max-w-52">
                <SelectValue placeholder="1. Choose a country" />
              </SelectTrigger>
              <SelectContent>
                {byCountry.map((g) => (
                  <SelectItem key={g.country} value={g.country}>
                    {g.country}
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
                <SelectValue placeholder="2. Choose a university">
                  {(value: string) => universities.find((u) => u.id === value)?.name ?? "2. Choose a university"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {universitiesInCountry.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                    {u.id === dreamUniversityId ? " (Dream)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPdf} disabled={!analysis}>
              <Download />
              Download Admission Report
            </Button>
            <Button onClick={handleSaveReport} disabled={!analysis || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              Save report
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && university ? (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="flex flex-col items-center justify-center gap-4 py-8 xl:col-span-1">
              <ScoreCircle score={analysis.score} />
              <div className="flex flex-col items-center gap-1">
                <p className="font-heading text-lg font-semibold text-foreground">{university.name}</p>
                <MatchBadge category={analysis.category} />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Confidence
                <span className="font-mono font-medium text-foreground">{analysis.confidence}%</span>
              </div>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Score breakdown</CardTitle>
                <CardDescription>How your admission chance is calculated</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {analysis.breakdown.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.weight}% weight</span>
                    </div>
                    <p className="mt-2 font-heading text-2xl font-semibold text-foreground">
                      {item.score}%
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-brand"
                        style={{ width: `${Math.min(100, item.score)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <InsightCard
              icon={CheckCircle2}
              accent="emerald"
              title="Strengths"
              items={analysis.strengths}
            />
            <InsightCard
              icon={TriangleAlert}
              accent="rose"
              title="Weaknesses"
              items={analysis.weaknesses}
              emptyText="No significant weaknesses detected."
            />
            <InsightCard
              icon={Lightbulb}
              accent="amber"
              title="Recommendations"
              items={analysis.recommendations}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Admission analysis</h1>
      <p className="text-sm text-muted-foreground">
        A rule-based breakdown of your admission chance for any university on the platform.
      </p>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
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
        <span className="font-heading text-3xl font-semibold text-foreground">{score}%</span>
        <span className="text-xs text-muted-foreground">chance</span>
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
