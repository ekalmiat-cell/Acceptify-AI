/**
 * The canonical set of admission-criterion keys an evaluation profile can
 * assign a weight to. Mirrors `backend/app/core/criteria.py` exactly —
 * both sides must stay in sync, since these keys double as achievement
 * catalog ids (see `data/achievement-catalog.ts`) for every non-academic
 * criterion.
 */

export const ACADEMIC_CRITERIA = ["gpa", "sat", "act", "ielts", "toefl", "ent"] as const;

export const ACHIEVEMENT_CRITERIA = [
  "ap",
  "ib",
  "aLevel",
  "honors",
  "research",
  "publications",
  "olympiads",
  "hackathons",
  "startup",
  "business",
  "leadership",
  "mun",
  "debate",
  "communityService",
  "sports",
  "music",
  "arts",
  "awards",
  "recommendationLetters",
  "personalEssay",
] as const;

export const ALL_CRITERIA = [...ACADEMIC_CRITERIA, ...ACHIEVEMENT_CRITERIA] as const;

export type AcademicCriterionKey = (typeof ACADEMIC_CRITERIA)[number];
export type AchievementCriterionKey = (typeof ACHIEVEMENT_CRITERIA)[number];
export type CriterionKey = (typeof ALL_CRITERIA)[number];

/** A program's evaluation profile as loaded from the backend — a flat
 * per-criterion weight map. A criterion missing from `weights` (or weighted
 * 0) simply doesn't affect the score for that program. */
export interface EvaluationWeights {
  evaluationProfileId: string | null;
  programId: string | null;
  weights: Partial<Record<CriterionKey, number>>;
}

/**
 * Fallback weights used when no program has been selected yet, or a
 * program has no evaluation profile of its own — e.g. browsing universities
 * before picking a field of study. Mirrors `backend/app/core/criteria.py`'s
 * `DEFAULT_WEIGHTS` so the two never disagree on what "no program-specific
 * profile" means.
 */
/**
 * Fallback levels for the two exams a university may not state a bar for.
 *
 * ENT is a national exam read by every Kazakhstani university and no program
 * in the catalog publishes its own cutoff, so a national competitive level is
 * what it is genuinely measured against. ACT is different: `University`
 * carries `actMin`/`actMax`, and this constant is only reached for
 * universities whose range is missing — see `lib/benchmarks.ts`, which is the
 * single place either value is consumed. Scoring an ACT against this
 * constant even where the university published a range (which is what used
 * to happen) marked a 30 as sub-par at a school asking 26-31.
 */
export const ACT_COMPETITIVE_BASELINE = 33;
export const ENT_COMPETITIVE_BASELINE = 120;

/** Human-readable labels for the academic criteria — achievement criteria
 * get their labels from `data/achievement-catalog.ts` instead, since those
 * are already user-facing strings. */
export const ACADEMIC_CRITERION_LABELS: Record<AcademicCriterionKey, string> = {
  gpa: "GPA",
  sat: "SAT",
  act: "ACT",
  ielts: "IELTS",
  toefl: "TOEFL",
  ent: "National exam (ENT)",
};

export const DEFAULT_WEIGHTS: Partial<Record<CriterionKey, number>> = {
  gpa: 10,
  sat: 9,
  act: 7,
  ielts: 5,
  toefl: 4,
  ent: 5,
  ap: 2,
  ib: 2,
  aLevel: 1,
  honors: 2,
  research: 3,
  publications: 2,
  olympiads: 7,
  hackathons: 6,
  startup: 6,
  business: 6,
  leadership: 4,
  mun: 3,
  debate: 3,
  communityService: 3,
  sports: 2,
  music: 2,
  arts: 2,
  awards: 2,
  recommendationLetters: 2,
  personalEssay: 3,
};
