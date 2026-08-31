import { ALL_CRITERIA } from "@/lib/criteria";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import type { StatItem, University } from "@/types/domain";

/**
 * The numbers the landing page puts its name behind.
 *
 * Every one of these is derived from something the platform can actually
 * show you: rows in the university catalog, countries present in it, the
 * criteria the scoring engine weighs, and the fields of study the
 * evaluation models are tuned for. Nothing here is an estimate of usage,
 * outcomes, or accuracy — those would be claims we have no data to support.
 */
export function buildPlatformStats(universities: University[]): StatItem[] {
  const countries = new Set(universities.map((university) => university.country));

  return [
    {
      id: "stat-universities",
      value: String(universities.length),
      label: "universities in the catalog",
    },
    {
      id: "stat-countries",
      value: String(countries.size),
      label: "countries covered",
    },
    {
      id: "stat-criteria",
      value: String(ALL_CRITERIA.length),
      label: "criteria scored per application",
    },
    {
      id: "stat-fields",
      value: String(FIELDS_OF_STUDY.length),
      label: "fields of study with their own weighting",
    },
  ];
}
