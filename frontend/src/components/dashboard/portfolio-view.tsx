import Link from "next/link";
import { Info, ShieldCheck, Target, Flame, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MatchBadge } from "@/components/shared/match-badge";
import { formatProbability } from "@/lib/probability";
import type { Portfolio } from "@/lib/portfolio";

export function PortfolioView({
  portfolio,
  isSuggested,
}: {
  portfolio: Portfolio;
  /** True when the student hasn't saved enough reports yet and the list
   * below is a suggestion rather than their own shortlist. Said plainly:
   * presenting a suggestion as "your applications" would be a fiction the
   * rest of the page then does arithmetic on. */
  isSuggested: boolean;
}) {
  const { entries, balance, odds, warnings } = portfolio;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Application portfolio
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSuggested
            ? "A balanced starting list, built from your profile. Save reports from the analysis page to make this your own."
            : "Every university you've saved a report for, and what they add up to."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Chance of at least one admission</CardTitle>
            <CardDescription>
              Across all {entries.length} application{entries.length === 1 ? "" : "s"} on this
              list
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <span className="font-heading text-4xl font-semibold text-foreground">
                {formatProbability(odds.correlated)} – {formatProbability(odds.independent)}
              </span>
            </div>
            {/*
              A range, not a number, because the two ends are the two honest
              readings of the same list. Admissions decisions are correlated —
              the same essay and the same transcript are read everywhere — so
              the independent figure is an upper bound, and the best single
              chance is what remains if the correlation is total.
            */}
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                The high end assumes each decision is independent; the low end assumes they
                move together, in which case your best single chance is the whole story.
                Reality sits between the two — committees read overlapping signals, so a
                weak application is weak in several places at once.
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
            <CardDescription>How the list is spread</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BalanceRow icon={ShieldCheck} label="Safe" count={balance.safe} accent="emerald" />
            <BalanceRow icon={Target} label="Target" count={balance.target} accent="amber" />
            <BalanceRow icon={Flame} label="Reach" count={balance.reach} accent="rose" />
          </CardContent>
        </Card>
      </div>

      {warnings.length > 0 ? (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <TriangleAlert className="size-4" />
              </span>
              Worth fixing about this list
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              {warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                  {warning}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Fit score is how closely you match what each programme asks for. The estimate
            beside it combines that fit with the university&apos;s acceptance rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">University</TableHead>
                <TableHead>Fit score</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="pr-4 text-right">Estimated chance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(({ university, fitScore, category, probability }) => (
                <TableRow key={university.id}>
                  <TableCell className="pl-4">
                    <Link
                      href={`/dashboard/universities/${university.slug}`}
                      className="flex items-center gap-2.5 font-medium text-foreground hover:text-brand"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-[0.65rem] font-semibold">
                        {university.logoInitials}
                      </span>
                      <span className="flex flex-col">
                        {university.shortName}
                        <span className="text-xs font-normal text-muted-foreground">
                          {university.acceptanceRate}% acceptance rate
                        </span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{fitScore}</TableCell>
                  <TableCell>
                    <MatchBadge category={category} />
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <span className="font-mono text-sm font-medium">
                      {formatProbability(probability.p)}
                    </span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {formatProbability(probability.low)}–{formatProbability(probability.high)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          These probabilities are model estimates, not measured rates — the model has not yet
          been fitted against real admission outcomes.{" "}
          <Link href="/dashboard/methodology" className="underline hover:text-foreground">
            How this is calculated
          </Link>
          .
        </p>
        <Button render={<Link href="/dashboard/analysis" />} size="sm" variant="outline">
          Add another university
        </Button>
      </div>
    </div>
  );
}

const balanceAccent = {
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
} as const;

function BalanceRow({
  icon: Icon,
  label,
  count,
  accent,
}: {
  icon: typeof ShieldCheck;
  label: string;
  count: number;
  accent: keyof typeof balanceAccent;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex size-7 items-center justify-center rounded-lg ${balanceAccent[accent]}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="text-sm font-medium">{label}</span>
      <Badge variant="outline" className="ml-auto font-mono">
        {count}
      </Badge>
    </div>
  );
}
