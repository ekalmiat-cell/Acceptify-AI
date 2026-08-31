/**
 * The what-if simulator: "what would actually move my score, and what is the
 * cheapest way to reach the score I need?"
 *
 * Every answer here is produced by re-running the real scoring engine on a
 * modified copy of the student's profile — there is no separate model of
 * what "should" help. That matters: an explanation that isn't computed the
 * same way as the score can disagree with it, and a student told that IELTS
 * is worth 9 points who then raises IELTS and sees 3 has been lied to.
 *
 * Two consequences of that choice are deliberate:
 *
 * - Deltas are computed from the *rounded* score, because that is the number
 *   the student sees. A lever whose true effect is +0.4 points shows as +0
 *   and is dropped rather than advertised.
 * - Programme weights drive everything. A programme that weights olympiads
 *   at 0 will never suggest an olympiad, however impressive it is in general.
 */

import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_SCALE_MAX, academicBenchmark } from "@/lib/benchmarks";
import {
  ACADEMIC_CRITERIA,
  ACADEMIC_CRITERION_LABELS,
  ACHIEVEMENT_CRITERIA,
  type AcademicCriterionKey,
  type AchievementCriterionKey,
  type CriterionKey,
} from "@/lib/criteria";
import {
  academicValue,
  predictMatch,
  withAcademicValue,
  type CriterionWeights,
  type StudentProfileInput,
} from "@/lib/predict";
import type { University } from "@/types/domain";

export interface Lever {
  /** Stable within one simulation — safe as a React key. */
  id: string;
  kind: "academic" | "achievement";
  criterion: CriterionKey;
  /** The action, phrased as the student would do it. */
  label: string;
  /** Where they're starting from, and roughly what it costs. */
  detail: string;
  /**
   * Rough weeks of focused work. Not a promise and not measured — an ordering
   * device, so "write your personal essay" outranks "publish research" when
   * both add the same points. Kept visible in the UI precisely so a student
   * can disagree with it.
   */
  effortWeeks: number;
  /** Fit-score points gained, as displayed (integer, ≥ 1). */
  delta: number;
  scoreAfter: number;
  /** The profile that results from taking this action — lets the UI apply a
   * suggestion without recomputing how. */
  profile: StudentProfileInput;
}

/** Increments offered for a test the student has already sat. Two sizes each:
 * a realistic retake, and a serious push. */
const ACADEMIC_STEPS: Record<
  AcademicCriterionKey,
  readonly { amount: number; effortWeeks: number }[]
> = {
  gpa: [
    { amount: 0.2, effortWeeks: 12 },
    { amount: 0.5, effortWeeks: 26 },
  ],
  sat: [
    { amount: 50, effortWeeks: 8 },
    { amount: 100, effortWeeks: 18 },
  ],
  act: [
    { amount: 2, effortWeeks: 8 },
    { amount: 4, effortWeeks: 18 },
  ],
  ielts: [
    { amount: 0.5, effortWeeks: 8 },
    { amount: 1, effortWeeks: 16 },
  ],
  toefl: [
    { amount: 7, effortWeeks: 8 },
    { amount: 15, effortWeeks: 16 },
  ],
  ent: [
    { amount: 10, effortWeeks: 10 },
    { amount: 20, effortWeeks: 20 },
  ],
};

/**
 * Cost of sitting a test the profile has no score for at all.
 *
 * GPA is absent on purpose: it is accumulated over years of school, so
 * "acquire a GPA" is not an action anyone can take this admissions cycle.
 */
const SITTING_EFFORT_WEEKS: Partial<Record<AcademicCriterionKey, number>> = {
  sat: 20,
  act: 20,
  ielts: 12,
  toefl: 12,
  ent: 24,
};

/**
 * Rough weeks of work behind each achievement. The spread is what carries the
 * information: an essay is a fortnight, a publication is most of a year, and
 * a plan that treats them as interchangeable is useless.
 */
const ACHIEVEMENT_EFFORT_WEEKS: Record<AchievementCriterionKey, number> = {
  ap: 16,
  ib: 40,
  aLevel: 40,
  honors: 20,
  research: 24,
  publications: 32,
  olympiads: 20,
  hackathons: 4,
  startup: 26,
  business: 20,
  leadership: 12,
  mun: 8,
  debate: 8,
  communityService: 6,
  sports: 26,
  music: 30,
  arts: 30,
  awards: 12,
  recommendationLetters: 2,
  personalEssay: 3,
};

const ACHIEVEMENT_LABELS: Partial<Record<AchievementCriterionKey, string>> =
  Object.fromEntries(achievementCatalog.map((item) => [item.id, item.label]));

/** Test scores are reported on their own scales — a GPA of 3.7000000000004
 * is an artefact of adding 0.2 to 3.5, not a grade. */
function roundToScale(criterion: AcademicCriterionKey, value: number): number {
  if (criterion === "gpa") return Math.round(value * 100) / 100;
  if (criterion === "ielts") return Math.round(value * 2) / 2;
  return Math.round(value);
}

function formatValue(criterion: AcademicCriterionKey, value: number): string {
  if (criterion === "gpa") return value.toFixed(2);
  if (criterion === "ielts") return value.toFixed(1);
  return String(value);
}

function weightOf(weights: CriterionWeights, criterion: CriterionKey): number {
  const weight = weights[criterion];
  return Number.isFinite(weight) && (weight as number) > 0 ? (weight as number) : 0;
}

/** Every action worth offering, before any of them are scored. */
function candidateProfiles(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights
): Omit<Lever, "delta" | "scoreAfter">[] {
  const candidates: Omit<Lever, "delta" | "scoreAfter">[] = [];

  for (const criterion of ACADEMIC_CRITERIA) {
    // A criterion this programme doesn't weight cannot move the score, and a
    // criterion with no bar to clear isn't scored at all — offering either
    // would be advice to do work that provably changes nothing.
    if (weightOf(weights, criterion) === 0) continue;
    const benchmark = academicBenchmark(criterion, university);
    if (!benchmark) continue;

    const current = academicValue(criterion, profile);
    const max = ACADEMIC_SCALE_MAX[criterion];

    if (current == null) {
      const effortWeeks = SITTING_EFFORT_WEEKS[criterion];
      if (effortWeeks == null) continue;

      // Aim at the bar itself: the honest version of "what happens if I take
      // this test" is "if you meet what they ask for".
      const target = roundToScale(criterion, Math.min(benchmark.value, max));
      candidates.push({
        id: `sit-${criterion}`,
        kind: "academic",
        criterion,
        label: `Sit ${ACADEMIC_CRITERION_LABELS[criterion]} and score ${formatValue(criterion, target)}`,
        detail: `Not on your profile yet · ${benchmark.label} · ~${effortWeeks} weeks`,
        effortWeeks,
        profile: withAcademicValue(criterion, target, profile),
      });
      continue;
    }

    if (current >= max) continue;

    for (const step of ACADEMIC_STEPS[criterion]) {
      const target = roundToScale(criterion, Math.min(current + step.amount, max));
      if (target <= current) continue;

      candidates.push({
        id: `raise-${criterion}-${step.amount}`,
        kind: "academic",
        criterion,
        label: `Raise ${ACADEMIC_CRITERION_LABELS[criterion]} to ${formatValue(criterion, target)}`,
        detail: `From ${formatValue(criterion, current)} · ${benchmark.label} · ~${step.effortWeeks} weeks`,
        effortWeeks: step.effortWeeks,
        profile: withAcademicValue(criterion, target, profile),
      });
    }
  }

  for (const criterion of ACHIEVEMENT_CRITERIA) {
    if (weightOf(weights, criterion) === 0) continue;
    if (profile.achievements[criterion]) continue;

    const effortWeeks = ACHIEVEMENT_EFFORT_WEEKS[criterion];
    candidates.push({
      id: `earn-${criterion}`,
      kind: "achievement",
      criterion,
      label: `Add ${ACHIEVEMENT_LABELS[criterion] ?? criterion}`,
      detail: `Weighted ${weightOf(weights, criterion)} by this programme · ~${effortWeeks} weeks`,
      effortWeeks,
      profile: {
        ...profile,
        achievements: { ...profile.achievements, [criterion]: true },
      },
    });
  }

  return candidates;
}

/**
 * Every action that would raise this student's fit score at this university,
 * strongest first. Ties break towards the cheaper action.
 */
export function simulateLevers(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights,
  { limit }: { limit?: number } = {}
): Lever[] {
  const baseline = predictMatch(university, profile, weights).score;

  const levers = candidateProfiles(university, profile, weights)
    .map((candidate) => {
      const scoreAfter = predictMatch(university, candidate.profile, weights).score;
      return { ...candidate, scoreAfter, delta: scoreAfter - baseline };
    })
    .filter((lever) => lever.delta > 0)
    .sort((a, b) => b.delta - a.delta || a.effortWeeks - b.effortWeeks);

  return limit == null ? levers : levers.slice(0, limit);
}

export interface ImprovementPlan {
  target: number;
  from: number;
  to: number;
  /** False when the target is out of reach even after every worthwhile
   * action — which is itself the answer, and shown as one. */
  reached: boolean;
  steps: Lever[];
  totalEffortWeeks: number;
}

/**
 * The cheapest sequence of actions that reaches `target`.
 *
 * Greedy on points-per-week, re-simulated from scratch after each step
 * rather than assuming the deltas add up — they don't. The engine
 * renormalises over whichever criteria are present, so adding a first
 * achievement changes what every later one is worth. Picking all the steps
 * up front from a single simulation is the obvious implementation and it
 * produces plans whose promised total never arrives.
 *
 * Greedy is not guaranteed optimal, and the honest reason to use it anyway
 * is that the effort numbers it optimises against are estimates — searching
 * exhaustively would compute a precise answer to an imprecise question.
 */
export function planToTarget(
  university: University,
  profile: StudentProfileInput,
  weights: CriterionWeights,
  target: number,
  { maxSteps = 6 }: { maxSteps?: number } = {}
): ImprovementPlan {
  const from = predictMatch(university, profile, weights).score;

  let current = profile;
  let score = from;
  const steps: Lever[] = [];

  while (score < target && steps.length < maxSteps) {
    const levers = simulateLevers(university, current, weights);
    if (levers.length === 0) break;

    // Best value for the time it costs, not simply the biggest jump: a
    // 3-point essay beats a 4-point olympiad when one is a weekend and the
    // other is a season.
    const best = levers.reduce((winner, lever) =>
      lever.delta / lever.effortWeeks > winner.delta / winner.effortWeeks ? lever : winner
    );

    steps.push(best);
    current = best.profile;
    score = best.scoreAfter;
  }

  return {
    target,
    from,
    to: score,
    reached: score >= target,
    steps,
    totalEffortWeeks: steps.reduce((sum, step) => sum + step.effortWeeks, 0),
  };
}
