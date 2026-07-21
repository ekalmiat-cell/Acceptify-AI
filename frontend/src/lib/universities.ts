import type { University } from "@/types/domain";

export function getUniversityBySlug(universities: University[], slug: string): University | undefined {
  return universities.find((u) => u.slug === slug);
}

export function getUniversityById(universities: University[], id: string): University | undefined {
  return universities.find((u) => u.id === id);
}

/** Universities grouped by country, countries alphabetical, universities
 * within each country ordered by world ranking — used to organize
 * country-then-university pickers. */
export function groupUniversitiesByCountry(
  universities: University[]
): { country: string; universities: University[] }[] {
  const byCountry = new Map<string, University[]>();
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
      universities: [...list].sort((a, b) => a.worldRanking - b.worldRanking),
    }));
}
