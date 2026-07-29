/**
 * Shared domain types. University data is a static catalog (`@/data`);
 * predictions, academic profile, and achievements are real per-user data
 * fetched from the FastAPI backend (see `lib/predictions-server.ts` and
 * `lib/profile-server.ts`).
 */

export type MatchCategory = "safe" | "target" | "reach";

export interface UniversityRequirement {
  label: string;
  value: string;
}

export interface University {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  logoInitials: string;
  worldRanking: number;
  nationalRanking: number | null;
  acceptanceRate: number;
  selectivityLevel: string;
  tuitionPerYearUsd: number;
  livingCostPerYearUsd: number;
  scholarshipAvailable: boolean;
  scholarshipCoverage: string;
  applicationDeadline: string;
  decisionType: "Early Decision" | "Early Action" | "Regular Decision" | "Rolling";
  tags: string[];
  description: string;
  minGpa: number;
  satLow: number;
  satHigh: number;
  actMin: number | null;
  actMax: number | null;
  ieltsMin: number;
  toeflMin: number;
  requirements: UniversityRequirement[];
  acceptRateTrend: { year: string; rate: number }[];
  gradientFrom: string;
  gradientTo: string;
  website: string;
}

/** A field of study offered at a university — sits between University and
 * EvaluationProfile. `parentProgramId`/`level` are unused today but let a
 * Program become a Specialization of another Program (e.g. "Artificial
 * Intelligence" under "Computer Science") without a schema change. */
export interface Program {
  id: string;
  universityId: string;
  slug: string;
  name: string;
  field: string;
  parentProgramId: string | null;
  level: "program" | "specialization";
  description: string | null;
}

export interface EvaluationWeightEntry {
  criterionKey: string;
  weight: number;
}

/** A program's admission-scoring configuration, stored in Postgres and
 * editable from the admin panel — see `lib/predict.ts` for how the weights
 * are applied. */
export interface EvaluationProfile {
  id: string;
  programId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  weights: EvaluationWeightEntry[];
}

export interface PredictionHistoryEntry {
  id: string;
  universityId: string;
  matchScore: number;
  category: MatchCategory;
  createdAt: string;
  status: "Saved" | "Applied" | "Considering" | "Analyzed";
}

/** Static metadata for an achievement type — defines what it is, not
 * whether any particular user has it. See `data/achievement-catalog.ts`. */
export interface AchievementCatalogItem {
  id: string;
  label: string;
  group: "Competitions" | "Activities" | "Talents" | "Credentials";
  icon: string;
  description: string;
  maxValue?: string;
}

/** A user's real academic profile — the direct inputs to the match
 * prediction engine. `null` means the user hasn't entered that field yet. */
export interface AcademicProfile {
  gpa: number | null;
  satScore: number | null;
  actScore: number | null;
  ieltsScore: number | null;
  toeflScore: number | null;
  entScore: number | null;
  dreamUniversityId: string | null;
  dreamProgramId: string | null;
}

/** The result of running the admission scoring engine for one university —
 * see `lib/scoring.ts`. Rule-based and fully explainable; no external AI
 * call involved. */
export interface AdmissionAnalysis {
  score: number;
  category: MatchCategory;
  confidence: number;
  breakdown: {
    label: string;
    weight: number;
    score: number;
  }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

/** A user's self-reported record for one achievement catalog entry. Only
 * achievements the user has actually filled in have a record — everything
 * else is treated as not-yet-achieved. */
export interface AchievementRecord {
  key: string;
  achieved: boolean;
  value: string | null;
  level: string | null;
}

/** An achievement catalog item merged with (if any) the user's real record
 * for it — what components actually render. */
export interface ResolvedAchievement extends AchievementCatalogItem {
  achieved: boolean;
  value: string | null;
  level: string | null;
  progress: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  university: string;
  quote: string;
  initials: string;
  admitted: boolean;
}

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  billingPeriod: "month" | "one-time";
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StatItem {
  id: string;
  value: string;
  suffix?: string;
  label: string;
}
