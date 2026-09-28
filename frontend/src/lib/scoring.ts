import {
  computeBreakdownWeights,
  computeScoreBreakdown,
  predictMatch,
  type CriterionWeights,
  type StudentProfileInput,
} from "@/lib/predict";
import { DEFAULT_WEIGHTS } from "@/lib/criteria";
import type { Locale } from "@/lib/i18n/core";
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
const ANALYSIS_COPY = {
  en: {
    buckets: ["Academic strength", "Activities", "Leadership", "Achievements"],
    academic: [
      "Strong academic profile relative to this university's typical admit.",
      "Academic scores fall below this university's typical range.",
      "Focus on raising your GPA, SAT, or IELTS score to close the academic gap.",
    ],
    activities: [
      "Well-rounded extracurricular activities and competition history.",
      "Limited extracurricular activity on record.",
      "Join olympiads, hackathons, or clubs to build a broader activity profile.",
    ],
    leadership: [
      "Demonstrated leadership experience.",
      "Little leadership experience recorded.",
      "Seek leadership roles in clubs, student government, or Model UN.",
    ],
    achievements: [
      "Strong record of research, publications, or community impact.",
      "Few research, publication, or volunteering credentials on record.",
      "Pursue a research project, publish your work, or take on volunteer work.",
    ],
    baseline: "A baseline profile is in place — every category has room to grow.",
    keepUpdated: "Keep your profile up to date as you gain new achievements.",
  },
  ru: {
    buckets: ["Учёба", "Активности", "Лидерство", "Достижения"],
    academic: [
      "Сильный академический профиль по сравнению с типичным поступившим сюда.",
      "Академические баллы ниже типичного диапазона этого университета.",
      "Сосредоточься на повышении GPA, SAT или IELTS, чтобы закрыть академический разрыв.",
    ],
    activities: [
      "Разносторонние внеучебные активности и опыт соревнований.",
      "Внеучебных активностей в профиле мало.",
      "Участвуй в олимпиадах, хакатонах или клубах, чтобы расширить профиль.",
    ],
    leadership: [
      "Есть подтверждённый лидерский опыт.",
      "Лидерского опыта в профиле почти нет.",
      "Ищи лидерские роли в клубах, школьном самоуправлении или Model UN.",
    ],
    achievements: [
      "Сильные исследования, публикации или общественный вклад.",
      "Мало исследований, публикаций или волонтёрства в профиле.",
      "Займись исследовательским проектом, опубликуй работу или возьмись за волонтёрство.",
    ],
    baseline: "Базовый профиль есть — в каждой категории есть куда расти.",
    keepUpdated: "Обновляй профиль, когда появляются новые достижения.",
  },
} satisfies Record<Locale, unknown>;

export function computeAdmissionAnalysis(
  university: University,
  profile: StudentProfileInput,
  profileCompleteness: number,
  weights: CriterionWeights = DEFAULT_WEIGHTS,
  locale: Locale = "en"
): AdmissionAnalysis {
  const t = ANALYSIS_COPY[locale];
  const { score, category } = predictMatch(university, profile, weights);
  const raw = computeScoreBreakdown(university, profile, weights);
  const bucketWeights = computeBreakdownWeights(weights);

  // `null` survives all the way to the UI on purpose — a component that this
  // program does not assess must read as "not assessed", not as 0%.
  const round = (value: number | null) => (value == null ? null : Math.round(value));

  const breakdown = [
    { label: t.buckets[0], weight: bucketWeights.academicStrength, score: round(raw.academicStrength) },
    { label: t.buckets[1], weight: bucketWeights.activities, score: round(raw.activities) },
    { label: t.buckets[2], weight: bucketWeights.leadership, score: round(raw.leadership) },
    { label: t.buckets[3], weight: bucketWeights.achievements, score: round(raw.achievements) },
  ];

  const confidence = Math.round(Math.min(98, Math.max(35, profileCompleteness)));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  /**
   * A component this program does not assess (`null`) yields neither a
   * strength nor a weakness. Guarding explicitly matters here: `null < 45`
   * is `true` in JavaScript, so an un-assessed component would otherwise be
   * reported to the student as a weakness — and generate advice telling them
   * to fix something that has no bearing on their application.
   */
  const appraise = (
    value: number | null,
    strong: string,
    weak: string,
    advice: string
  ) => {
    if (value == null) return;
    if (value >= STRONG) {
      strengths.push(strong);
    } else if (value < WEAK) {
      weaknesses.push(weak);
      recommendations.push(advice);
    }
  };

  appraise(raw.academicStrength, ...(t.academic as [string, string, string]));
  appraise(raw.activities, ...(t.activities as [string, string, string]));
  appraise(raw.leadership, ...(t.leadership as [string, string, string]));
  appraise(raw.achievements, ...(t.achievements as [string, string, string]));

  if (strengths.length === 0) strengths.push(t.baseline);
  if (recommendations.length === 0) recommendations.push(t.keepUpdated);

  return { score, category, confidence, breakdown, strengths, weaknesses, recommendations };
}
