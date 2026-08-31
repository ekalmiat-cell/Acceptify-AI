import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
import { achievementCatalog } from "@/data/achievement-catalog";
import {
  ACADEMIC_CRITERIA,
  ACADEMIC_CRITERION_LABELS,
  DEFAULT_WEIGHTS,
  type CriterionKey,
} from "@/lib/criteria";
import { SCORE_CEILING, SCORE_FLOOR } from "@/lib/predict";
import { CALIBRATION_TARGET_OUTCOMES, FIT_LOG_ODDS_SPAN } from "@/lib/probability";
import { getOutcomeSummary } from "@/lib/predictions-server";
import { getAcademicProfile } from "@/lib/profile-server";
import { getUniversities } from "@/lib/universities-server";
import { getUniversityById } from "@/lib/universities";
import { resolveWeightsForUniversity } from "@/lib/weights-server";

export const metadata: Metadata = {
  title: "Methodology",
};

const achievementLabels = new Map(achievementCatalog.map((item) => [item.id, item.label]));

function labelFor(criterion: CriterionKey): string {
  return (
    ACADEMIC_CRITERION_LABELS[criterion as keyof typeof ACADEMIC_CRITERION_LABELS] ??
    achievementLabels.get(criterion) ??
    criterion
  );
}

/**
 * How the numbers on this platform are produced, written for the person
 * being scored by them.
 *
 * The page exists because "trust the AI" is not an answer a student can act
 * on or check. Everything here is read from the same constants and the same
 * evaluation profile the engine uses, so it cannot describe a model the app
 * isn't running — and the calibration section reports what the outcome data
 * actually supports, which today is nothing.
 */
export default async function MethodologyPage() {
  const [academic, summary, universities] = await Promise.all([
    getAcademicProfile(),
    getOutcomeSummary(),
    getUniversities(),
  ]);

  const university = academic.dreamUniversityId
    ? (getUniversityById(universities, academic.dreamUniversityId) ?? null)
    : null;

  const weights = university
    ? await resolveWeightsForUniversity(academic, university.id)
    : DEFAULT_WEIGHTS;

  const isProgrammeSpecific = weights !== DEFAULT_WEIGHTS;

  const rows = (Object.entries(weights) as [CriterionKey, number][])
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalWeight = rows.reduce((sum, [, weight]) => sum + weight, 0);

  const separation =
    summary.meanScoreAdmitted != null && summary.meanScoreRejected != null
      ? Math.round((summary.meanScoreAdmitted - summary.meanScoreRejected) * 10) / 10
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">How this is calculated</h1>
        <p className="text-sm text-muted-foreground">
          Every number the platform shows you, and where it comes from.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The fit score</CardTitle>
          <CardDescription>
            What it measures — and the one thing it is not
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            For each criterion a programme weights, we divide your result by the bar that
            programme asks for — your IELTS over their minimum, your SAT over the midpoint of
            their published range. Clearing a bar comfortably counts for a little extra, up to
            15%; nothing counts for more than that, so one exceptional score cannot carry a
            profile on its own.
          </p>
          <p>
            Those ratios are averaged using the programme&apos;s own weights, then adjusted for
            how selective the university is — a strong profile still reads as a reach at a
            school that turns down most of the people who clear its bars. The result is
            reported between {SCORE_FLOOR} and {SCORE_CEILING}, never 0 and never 100, because
            this is an estimate and the ends of the scale would claim certainty.
          </p>
          <p className="text-foreground">
            A fit score is not a probability of admission. A 70 means your profile sits
            comfortably above what this programme asks for. It does not mean 70% of students
            like you get in — that is a different quantity, and it is derived separately below.
          </p>
          <p>
            Criteria you have left blank, and criteria the programme weights at zero, are left
            out of the average entirely rather than counted as zeros. A programme that does not
            assess leadership is not told you have none.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isProgrammeSpecific && university
              ? `Your evaluation model — ${university.shortName}`
              : "Your evaluation model — platform default"}
          </CardTitle>
          <CardDescription>
            {isProgrammeSpecific
              ? "Set by this programme in the admin catalog. Every criterion, and how much it counts."
              : "You haven't declared a field of study at a programme with its own model yet, so the platform default applies."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Criterion</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead className="pr-4 text-right">Share of score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(([criterion, weight]) => (
                <TableRow key={criterion}>
                  <TableCell className="pl-4 font-medium">{labelFor(criterion)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(ACADEMIC_CRITERIA as readonly string[]).includes(criterion)
                      ? "Academic"
                      : "Achievement"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{weight}</TableCell>
                  <TableCell className="pr-4 text-right font-mono text-sm">
                    {totalWeight > 0 ? `${Math.round((weight / totalWeight) * 100)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Where each bar comes from</CardTitle>
          <CardDescription>What your result is actually compared against</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            GPA, SAT, IELTS and TOEFL are compared to the figures the university itself
            publishes. Where a university states no bar for a test, that test is left out of
            your score rather than scored against a guess.
          </p>
          <p>
            ACT is compared to the university&apos;s published range where the catalog has one,
            and to a generally-competitive level where it does not. The national exam (ENT) is
            sat once and read by every university, so it is always compared to a national
            competitive level. Anywhere a national level stands in, the requirements card
            labels it as such — so you always know whether you are below <em>their</em> bar or
            below a general one.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>From fit score to probability</CardTitle>
          <CardDescription>Used on the portfolio page, and nowhere else</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>
            A probability has to start from the base rate. We take the university&apos;s
            acceptance rate as the prior odds, then shift those odds by how far your fit sits
            above or below the middle of the scale — a perfect fit multiplies the odds by about{" "}
            {Math.round(Math.exp(FIT_LOG_ODDS_SPAN))}×, a bottom-of-scale fit divides them by
            the same. That is why a strong profile at a 4%-acceptance university is still
            reported as a long shot: most of the people it rejects also cleared its bars.
          </p>
          <p>
            Each estimate is shown as a range, not a point. The range widens the less complete
            your profile is, because an estimate built from two filled fields deserves to look
            less certain than one built from twenty.
          </p>
          <p>
            For a whole portfolio we report a bracket: the high end assumes each decision is
            independent (1 − ∏(1 − pᵢ)), the low end assumes they move together, in which case
            your best single chance is the whole story. Real decisions are correlated — the
            same essay and transcript are read everywhere — so the truth is between them.
          </p>
        </CardContent>
      </Card>

      <Card className={summary.isCalibrated ? undefined : "border-amber-500/30"}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Calibration
            <Badge variant="outline">
              {summary.isCalibrated ? "Calibrated" : "Not calibrated yet"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Whether the model has been checked against what actually happened
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            {summary.reported} outcome{summary.reported === 1 ? "" : "s"} reported so far, of
            the {CALIBRATION_TARGET_OUTCOMES} needed before per-band admit rates mean anything.
            Until then the model is <span className="text-foreground">structural</span>: the
            direction and rough size of each effect are argued from first principles, not
            fitted to data. We would rather say so than show you a confident number we cannot
            support.
          </p>

          {summary.reported > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Admitted" value={summary.admitted} />
                <Stat label="Rejected" value={summary.rejected} />
                <Stat label="Waitlisted" value={summary.waitlisted} />
                <Stat label="Withdrew" value={summary.withdrawn} />
              </div>

              {separation != null ? (
                <p>
                  Mean fit score of admitted students: {summary.meanScoreAdmitted}. Of rejected
                  students: {summary.meanScoreRejected}.{" "}
                  {separation > 0
                    ? `The ${separation}-point gap is the first sign the score carries real signal — it is not proof of it.`
                    : "The score is not yet separating admits from rejections, which is exactly what this page exists to show."}
                </p>
              ) : null}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Predicted band</TableHead>
                    <TableHead>Outcomes in</TableHead>
                    <TableHead className="text-right">Admitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.bands.map((band) => (
                    <TableRow key={band.label}>
                      <TableCell className="font-medium">{band.label}</TableCell>
                      <TableCell className="font-mono">{band.reported}</TableCell>
                      <TableCell className="text-right font-mono">
                        {band.reported > 0
                          ? `${band.admitted} (${Math.round((band.admitted / band.reported) * 100)}%)`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : null}

          <p>
            If you have heard back from a university,{" "}
            <Link href="/dashboard" className="underline hover:text-foreground">
              report the outcome on your dashboard
            </Link>
            . It is the only thing that turns this section into evidence.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="font-heading text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
