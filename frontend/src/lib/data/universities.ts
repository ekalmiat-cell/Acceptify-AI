import "server-only";
import { unstable_cache } from "next/cache";

import fallbackUniversities from "@/data/universities.json";
import { pgPool } from "@/lib/db";
import type { University } from "@/types/domain";

/** Cache tag for the catalog; call `revalidateTag` with it after any write. */
export const UNIVERSITIES_TAG = "universities";

/**
 * How long the catalog is served from Next's data cache. Up to ten dashboard
 * pages read ~300 KB of it, and it changes when the catalog is edited, not
 * per page view.
 */
const CATALOG_REVALIDATE_SECONDS = 300;

interface UniversityRow {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  country: string;
  city: string;
  logo_initials: string;
  world_ranking: number;
  national_ranking: number | null;
  acceptance_rate: number;
  selectivity_level: string;
  min_gpa: number;
  sat_low: number;
  sat_high: number;
  act_min: number | null;
  act_max: number | null;
  ielts_min: number;
  toefl_min: number;
  tuition_per_year_usd: number;
  living_cost_per_year_usd: number;
  scholarship_available: boolean;
  scholarship_coverage: string;
  application_deadline: string;
  decision_type: University["decisionType"];
  tags: string[];
  description: string;
  requirements: University["requirements"];
  accept_rate_trend: University["acceptRateTrend"];
  gradient_from: string;
  gradient_to: string;
  website: string;
}

function toUniversity(row: UniversityRow): University {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    country: row.country,
    city: row.city,
    logoInitials: row.logo_initials,
    worldRanking: row.world_ranking,
    nationalRanking: row.national_ranking,
    acceptanceRate: row.acceptance_rate,
    selectivityLevel: row.selectivity_level,
    minGpa: row.min_gpa,
    satLow: row.sat_low,
    satHigh: row.sat_high,
    actMin: row.act_min,
    actMax: row.act_max,
    ieltsMin: row.ielts_min,
    toeflMin: row.toefl_min,
    tuitionPerYearUsd: row.tuition_per_year_usd,
    livingCostPerYearUsd: row.living_cost_per_year_usd,
    scholarshipAvailable: row.scholarship_available,
    scholarshipCoverage: row.scholarship_coverage,
    applicationDeadline: row.application_deadline,
    decisionType: row.decision_type,
    tags: row.tags,
    description: row.description,
    requirements: row.requirements,
    acceptRateTrend: row.accept_rate_trend,
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    website: row.website,
  };
}

const loadCatalog = unstable_cache(
  async (): Promise<University[]> => {
    const result = await pgPool.query<UniversityRow>(
      "SELECT * FROM universities ORDER BY world_ranking ASC",
    );
    return result.rows.map(toUniversity);
  },
  ["universities-catalog"],
  { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [UNIVERSITIES_TAG] },
);

/**
 * The full university catalog from Postgres, ordered by world ranking.
 *
 * The database is the source of truth; `data/universities.json` is the seed
 * it was filled from (see scripts/migrate.mjs) and stays here only as a
 * last-resort fallback, so a database outage degrades the catalog to a
 * slightly stale snapshot instead of an empty page.
 */
export async function getUniversities(): Promise<University[]> {
  try {
    const universities = await loadCatalog();
    if (universities.length > 0) return universities;
    console.error("[universities] the universities table is empty — run `npm run db:migrate`");
  } catch (error) {
    console.error("[universities] could not read the catalog, serving the snapshot", error);
  }
  return fallbackUniversities as University[];
}

export async function universityExists(id: string): Promise<boolean> {
  const result = await pgPool.query("SELECT 1 FROM universities WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
