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
import { predictMatch, type StudentProfileInput } from "@/lib/predict";
import type { MatchCategory, University } from "@/types/domain";

type CategoryFilter = "all" | MatchCategory;

export function UniversitySearchView({
  profile,
  universities,
}: {
  profile: StudentProfileInput | null;
  universities: University[];
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

  const results = useMemo(() => {
    if (!profile) return [];
    return universities
      .map((university) => ({
        university,
        ...predictMatch(university, profile),
      }))
      .filter(({ university }) => {
        const matchesQuery =
          debouncedQuery.trim().length === 0 ||
          university.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          university.city.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          university.country.toLowerCase().includes(debouncedQuery.toLowerCase());
        const matchesCountry = country === "All countries" || university.country === country;
        const matchesSelectivity =
          selectivity === "All selectivity" || university.selectivityLevel === selectivity;
        return matchesQuery && matchesCountry && matchesSelectivity;
      })
      .filter((r) => category === "all" || r.category === category)
      .sort((a, b) => b.score - a.score);
  }, [profile, universities, debouncedQuery, country, selectivity, category]);

  const counts = useMemo(() => {
    if (!profile) return { all: 0, safe: 0, target: 0, reach: 0 };
    const scored = universities.map((u) => predictMatch(u, profile));
    return {
      all: scored.length,
      safe: scored.filter((s) => s.category === "safe").length,
      target: scored.filter((s) => s.category === "target").length,
      reach: scored.filter((s) => s.category === "reach").length,
    };
  }, [profile, universities]);

  if (!profile) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            University search
          </h1>
          <p className="text-sm text-muted-foreground">
            Every match score is computed live against your current profile.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Complete your profile first</p>
            <p className="text-xs text-muted-foreground">
              Add at least one academic score (GPA, SAT, IELTS, TOEFL, ACT, or ENT) to see match scores for every university.
            </p>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" className="mt-1">
            Complete your profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          University search
        </h1>
        <p className="text-sm text-muted-foreground">
          {universities.length} universities — every match score is computed live against your current profile.
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
