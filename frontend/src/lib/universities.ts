import type { CatalogUniversity, University } from "@/types/domain";

export function getUniversityBySlug(universities: University[], slug: string): University | undefined {
  return universities.find((u) => u.slug === slug);
}

export function getUniversityById(universities: University[], id: string): University | undefined {
  return universities.find((u) => u.id === id);
}

/** Universities grouped by country, countries alphabetical, universities
 * within each country ordered by world ranking — used to organize
 * country-then-university pickers. */
export function groupUniversitiesByCountry<U extends CatalogUniversity>(
  universities: U[]
): { country: string; universities: U[] }[] {
  const byCountry = new Map<string, U[]>();
  for (const university of universities) {
    const group = byCountry.get(university.country);
    if (group) {
      group.push(university);
    } else {
      byCountry.set(university.country, [university]);
    }
  }

  return Array.from(byCountry.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([country, list]) => ({
      country,
      universities: [...list].sort(byRanking),
    }));
}

/**
 * Catalog order: ranked universities by world ranking, then those without a
 * ranking (added from public data) from the most selective down.
 */
export function byRanking(
  a: { worldRanking: number | null; acceptanceRate: number; name: string },
  b: { worldRanking: number | null; acceptanceRate: number; name: string },
): number {
  if (a.worldRanking !== null && b.worldRanking !== null) return a.worldRanking - b.worldRanking;
  if (a.worldRanking !== null) return -1;
  if (b.worldRanking !== null) return 1;
  return a.acceptanceRate - b.acceptanceRate || a.name.localeCompare(b.name);
}

/** The catalog entry pages hand to client components; see CatalogUniversity. */
export function toCatalogEntry(university: University): CatalogUniversity {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { description, requirements, acceptRateTrend, ...entry } = university;
  return entry;
}
