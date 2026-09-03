"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UniversityCard } from "@/components/dashboard/university-card";
import { useDebounce } from "@/hooks/use-debounce";
import { predictMatch, type CriterionWeights, type StudentProfileInput } from "@/lib/predict";
import type { MatchCategory, University } from "@/types/domain";

type CategoryFilter = "all" | MatchCategory;

export function UniversitySearchView({
  profile,
  universities,
  weightsByUniversity,
  declaredField,
}: {
  profile: StudentProfileInput | null;
  universities: University[];
  /** Per-university evaluation weights for the student's declared field of
   * study, keyed by university id. Universities absent from the map are
   * scored with the platform defaults — resolved server-side so this list
   * agrees with every other screen (see lib/weights-server.ts). */
  weightsByUniversity: Record<string, CriterionWeights>;
  declaredField: string | null;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("All countries");
  const [selectivity, setSelectivity] = useState("All selectivity");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const debouncedQuery = useDebounce(query, 200);

  const countries = useMemo(
    () => ["All countries", ...new Set(universities.map((u) => u.country))],
    [universities]
  );
  const selectivityLevels = useMemo(
    () => ["All selectivity", ...new Set(universities.map((u) => u.selectivityLevel))],
    [universities]
  );

  /**
   * Scored once, then filtered — the score for a university does not depend
   * on which filters are active, and this list used to be built twice (once
   * for the cards, once for the tab counts) over the whole catalog.
   */
  const matched = useMemo(() => {
    return universities
      .map((university) => {
        if (profile) {
          const prediction = predictMatch(university, profile, weightsByUniversity[university.id]);
          return {
            university,
            score: prediction.score as number | null,
            category: prediction.category as MatchCategory | null,
          };
        }
        return {
          university,
          score: null,
          category: null,
        };
      })
      .filter(({ university }) => {
        const needle = debouncedQuery.trim().toLowerCase();
        const matchesQuery =
          needle.length === 0 ||
          university.name.toLowerCase().includes(needle) ||
          university.city.toLowerCase().includes(needle) ||
          university.country.toLowerCase().includes(needle);
        const matchesCountry = country === "All countries" || university.country === country;
        const matchesSelectivity =
          selectivity === "All selectivity" || university.selectivityLevel === selectivity;
        return matchesQuery && matchesCountry && matchesSelectivity;
      });
  }, [profile, universities, weightsByUniversity, debouncedQuery, country, selectivity]);

  const results = useMemo(
    () =>
      matched
        .filter((r) => category === "all" || r.category === category)
        .sort((a, b) => {
          if (a.score !== null && b.score !== null) {
            return b.score - a.score;
          }
          return a.university.worldRanking - b.university.worldRanking;
        }),
    [matched, category]
  );

  // Counts describe what each tab would actually show under the current
  // search and filters.
  const counts = useMemo(
    () => ({
      all: matched.length,
      safe: matched.filter((s) => s.category === "safe").length,
      target: matched.filter((s) => s.category === "target").length,
      reach: matched.filter((s) => s.category === "reach").length,
    }),
    [matched]
  );

  return (
    <div className="flex flex-col gap-6">
      {!profile && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Personalized match scores require an academic profile
              </p>
              <p className="text-xs text-muted-foreground">
                Add your GPA, SAT, IELTS, or other scores to calculate exact admission odds. You can still explore all universities and run what-if analyses below.
              </p>
            </div>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" variant="outline" className="shrink-0">
            Complete profile
          </Button>
        </div>
      )}

      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          University search
        </h1>
        <p className="text-sm text-muted-foreground">
          {universities.length} universities — every estimate is computed live against your current
          profile
          {declaredField
            ? `, using each university's evaluation model for ${declaredField} where one exists.`
            : ". Choose an intended field of study to have programmes weighted for it."}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by university, city, or country..."
            className="h-9 pl-8"
          />
        </div>

        <Select value={country} onValueChange={(v) => setCountry(v as string)}>
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectivity} onValueChange={(v) => setSelectivity(v as string)}>
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Selectivity" />
          </SelectTrigger>
          <SelectContent>
            {selectivityLevels.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="safe">Safe ({counts.safe})</TabsTrigger>
          <TabsTrigger value="target">Target ({counts.target})</TabsTrigger>
          <TabsTrigger value="reach">Reach ({counts.reach})</TabsTrigger>
        </TabsList>
      </Tabs>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">No universities match your filters</p>
          <p className="text-xs text-muted-foreground">Try a different search term, country, or selectivity level.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map(({ university, score, category: cat }) => (
            <UniversityCard key={university.id} university={university} score={score} category={cat} />
          ))}
        </div>
      )}
    </div>
  );
}
