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
import { fieldName } from "@/lib/catalog-copy";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { selectivityName } from "@/lib/university-copy";
import type { MatchCategory, University } from "@/types/domain";

type CategoryFilter = "all" | MatchCategory;

/** The "no filter" value of the country and selectivity selects. */
const ANY = "__any__";

const copy = defineCopy({
  en: {
    needProfile: "Personalized match scores require an academic profile",
    needProfileNote:
      "Add your GPA, SAT, IELTS, or other scores to calculate exact admission odds. You can still explore all universities and run what-if analyses below.",
    completeProfile: "Complete profile",
    title: "University search",
    subtitle: (n: number) => `${n} universities — every estimate is computed live against your current profile`,
    withField: (field: string) => `, using each university's evaluation model for ${field} where one exists.`,
    noField: ". Choose an intended field of study to have programmes weighted for it.",
    search: "Search by university, city, or country...",
    allCountries: "All countries",
    allSelectivity: "All selectivity",
    all: "All",
    safe: "Safe",
    target: "Target",
    reach: "Reach",
    none: "No universities match your filters",
    noneNote: "Try a different search term, country, or selectivity level.",
  },
  ru: {
    needProfile: "Для персональных оценок нужен академический профиль",
    needProfileNote:
      "Добавь GPA, SAT, IELTS или другие баллы, чтобы посчитать шансы на поступление. Смотреть университеты и пробовать «что если» можно и без этого.",
    completeProfile: "Заполнить профиль",
    title: "Поиск университетов",
    subtitle: (n: number) => `${n} университетов — каждая оценка считается прямо сейчас по твоему профилю`,
    withField: (field: string) => `, с моделью оценки каждого университета для направления «${field}», где она есть.`,
    noField: ". Выбери направление обучения, чтобы программы учитывались под него.",
    search: "Поиск по университету, городу или стране...",
    allCountries: "Все страны",
    allSelectivity: "Любой отбор",
    all: "Все",
    safe: "Надёжные",
    target: "Целевые",
    reach: "Амбициозные",
    none: "По этим фильтрам ничего не найдено",
    noneNote: "Попробуй другой запрос, страну или уровень отбора.",
  },
});

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
  const locale = useLocale();
  const t = copy[locale];
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState(ANY);
  const [selectivity, setSelectivity] = useState(ANY);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const debouncedQuery = useDebounce(query, 200);

  const countries = useMemo(
    () => [ANY, ...new Set(universities.map((u) => u.country))],
    [universities]
  );
  const selectivityLevels = useMemo(
    () => [ANY, ...new Set(universities.map((u) => u.selectivityLevel))],
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
          university.country.toLowerCase().includes(needle) ||
          countryName(university.country, locale).toLowerCase().includes(needle);
        const matchesCountry = country === ANY || university.country === country;
        const matchesSelectivity = selectivity === ANY || university.selectivityLevel === selectivity;
        return matchesQuery && matchesCountry && matchesSelectivity;
      });
  }, [profile, universities, weightsByUniversity, debouncedQuery, country, selectivity, locale]);

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
              <p className="text-sm font-medium text-foreground">{t.needProfile}</p>
              <p className="text-xs text-muted-foreground">{t.needProfileNote}</p>
            </div>
          </div>
          <Button render={<Link href="/dashboard/profile" />} size="sm" variant="outline" className="shrink-0">
            {t.completeProfile}
          </Button>
        </div>
      )}

      <div>
        <h1 className="font-display text-[1.65rem] leading-tight font-bold tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t.subtitle(universities.length)}
          {declaredField ? t.withField(fieldName(declaredField, locale)) : t.noField}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.search}
            className="h-9 pl-8"
          />
        </div>

        <Select value={country} onValueChange={(v) => setCountry(v as string)}>
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <SelectValue>
              {(value: string) => (value === ANY ? t.allCountries : countryName(value, locale))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c} value={c}>
                {c === ANY ? t.allCountries : countryName(c, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectivity} onValueChange={(v) => setSelectivity(v as string)}>
          <SelectTrigger className="w-full sm:w-52">
            <SlidersHorizontal className="size-3.5 text-muted-foreground" />
            <SelectValue>
              {(value: string) => (value === ANY ? t.allSelectivity : selectivityName(value, locale))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {selectivityLevels.map((s) => (
              <SelectItem key={s} value={s}>
                {s === ANY ? t.allSelectivity : selectivityName(s, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
        <TabsList>
          <TabsTrigger value="all">
            {t.all} ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="safe">
            {t.safe} ({counts.safe})
          </TabsTrigger>
          <TabsTrigger value="target">
            {t.target} ({counts.target})
          </TabsTrigger>
          <TabsTrigger value="reach">
            {t.reach} ({counts.reach})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">{t.none}</p>
          <p className="text-xs text-muted-foreground">{t.noneNote}</p>
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
