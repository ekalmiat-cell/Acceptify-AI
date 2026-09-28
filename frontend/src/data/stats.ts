import { ALL_CRITERIA } from "@/lib/criteria";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";
import type { Locale } from "@/lib/i18n/core";
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
const LABELS: Record<Locale, [string, string, string, string]> = {
  en: [
    "universities in the catalog",
    "countries covered",
    "criteria scored per application",
    "fields of study with their own weighting",
  ],
  ru: [
    "университетов в каталоге",
    "стран",
    "критериев в оценке каждой заявки",
    "направлений со своими весами",
  ],
};

export function buildPlatformStats(universities: University[], locale: Locale = "en"): StatItem[] {
  const countries = new Set(universities.map((university) => university.country));
  const [universitiesLabel, countriesLabel, criteriaLabel, fieldsLabel] = LABELS[locale];

  return [
    {
      id: "stat-universities",
      value: String(universities.length),
      label: universitiesLabel,
    },
    {
      id: "stat-countries",
      value: String(countries.size),
      label: countriesLabel,
    },
    {
      id: "stat-criteria",
      value: String(ALL_CRITERIA.length),
      label: criteriaLabel,
    },
    {
      id: "stat-fields",
      value: String(FIELDS_OF_STUDY.length),
      label: fieldsLabel,
    },
  ];
}
