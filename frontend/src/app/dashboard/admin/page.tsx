import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";

import { AdminResetLink } from "@/components/admin/admin-reset-link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getBetaStats, type BetaStats } from "@/lib/data/beta-stats";
import { getUniversities } from "@/lib/universities-server";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const [universities, stats] = await Promise.all([getUniversities(), getBetaStats()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Manage each university&apos;s programs and their per-criterion evaluation weights.
          </p>
        </div>
      </div>

      <BetaFunnelCard stats={stats} />

      <AdminResetLink />

      <Card>
        <CardHeader>
          <CardTitle>Universities</CardTitle>
          <CardDescription>Pick a university to manage its programs and evaluation profiles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {universities.map((university) => (
            <Link
              key={university.id}
              href={`/dashboard/admin/${university.id}`}
              className="group flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
                }}
              >
                {university.logoInitials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{university.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {university.city}, {university.country}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BetaFunnelCard({ stats }: { stats: BetaStats }) {
  const steps = [
    { label: "Signed up", value: stats.users },
    { label: "Filled in scores", value: stats.withProfile },
    { label: "Ran an analysis", value: stats.withAnalysis },
    { label: "Reviewed an essay", value: stats.withEssay },
  ];
  const percentOf = (value: number) =>
    stats.users > 0 ? `${Math.round((value / stats.users) * 100)}%` : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beta funnel</CardTitle>
        <CardDescription>
          {stats.newLast7Days} new and {stats.activeLast7Days} active students in the last 7
          days. Page views are in Vercel → Analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.label} className="rounded-xl border p-3">
              <p className="text-xs text-muted-foreground">{step.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{step.value}</p>
              <p className="text-xs text-muted-foreground">{percentOf(step.value)} of sign-ups</p>
            </div>
          ))}
        </div>
        {stats.signupsByDay.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Sign-ups per day, last 14 days
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
              {stats.signupsByDay.map((d) => (
                <span key={d.day}>
                  {d.day.slice(5)} <span className="font-semibold">{d.count}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
