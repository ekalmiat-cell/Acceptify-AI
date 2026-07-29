import {
  computeBreakdownWeights,
  computeScoreBreakdown,
  predictMatch,
  type CriterionWeights,
  type StudentProfileInput,
} from "@/lib/predict";
import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import type { AdmissionAnalysis, University } from "@/types/domain";

const STRONG = 70;
const WEAK = 45;

/**
 * The full admission analysis for one university: headline score/category
 * (via `predictMatch`, so it always matches what's shown everywhere else in
 * the app), a named breakdown, a confidence level, and rule-based
 * strengths/weaknesses/recommendations. Entirely deterministic — no
 * external AI call, just an explainable scoring formula.
 *
 * `weights` comes from the selected program's EvaluationProfile — falls
 * back to `DEFAULT_WEIGHTS` when no program has been resolved yet.
 * `profileCompleteness` (0-100, from `lib/profile.ts`) drives the
 * confidence score, so "how sure are we" and "how complete is your profile"
 * always agree with each other across the app.
 */
export function computeAdmissionAnalysis(
  university: University,
  profile: StudentProfileInput,
  profileCompleteness: number,
  weights: CriterionWeights = DEFAULT_WEIGHTS
): AdmissionAnalysis {
  const { score, category } = predictMatch(university, profile, weights);
  const raw = computeScoreBreakdown(university, profile, weights);
  const bucketWeights = computeBreakdownWeights(weights);

  const breakdown = [
    { label: "Academic strength", weight: bucketWeights.academicStrength, score: Math.round(raw.academicStrength) },
    { label: "Activities", weight: bucketWeights.activities, score: Math.round(raw.activities) },
    { label: "Leadership", weight: bucketWeights.leadership, score: Math.round(raw.leadership) },
    { label: "Achievements", weight: bucketWeights.achievements, score: Math.round(raw.achievements) },
  ];

  const confidence = Math.round(Math.min(98, Math.max(35, profileCompleteness)));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (raw.academicStrength >= STRONG) {
    strengths.push("Strong academic profile relative to this university's typical admit.");
  } else if (raw.academicStrength < WEAK) {
    weaknesses.push("Academic scores fall below this university's typical range.");
    recommendations.push("Focus on raising your GPA, SAT, or IELTS score to close the academic gap.");
  }

  if (raw.activities >= STRONG) {
    strengths.push("Well-rounded extracurricular activities and competition history.");
  } else if (raw.activities < WEAK) {
    weaknesses.push("Limited extracurricular activity on record.");
    recommendations.push("Join olympiads, hackathons, or clubs to build a broader activity profile.");
  }

  if (raw.leadership >= STRONG) {
    strengths.push("Demonstrated leadership experience.");
  } else if (raw.leadership < WEAK) {
    weaknesses.push("Little leadership experience recorded.");
    recommendations.push("Seek leadership roles in clubs, student government, or Model UN.");
  }

  if (raw.achievements >= STRONG) {
    strengths.push("Strong record of research, publications, or community impact.");
  } else if (raw.achievements < WEAK) {
    weaknesses.push("Few research, publication, or volunteering credentials on record.");
    recommendations.push("Pursue a research project, publish your work, or take on volunteer work.");
  }

  if (strengths.length === 0) {
    strengths.push("A baseline profile is in place — every category has room to grow.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Keep your profile up to date as you gain new achievements.");
  }

  return { score, category, confidence, breakdown, strengths, weaknesses, recommendations };
}
