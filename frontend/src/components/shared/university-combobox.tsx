"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UniversityLogo } from "@/components/shared/university-logo";
import { countryName } from "@/lib/countries";
import { defineCopy } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { CatalogUniversity } from "@/types/domain";

/** More than this and the list is a wall: the rest is one search away. */
const MAX_SHOWN = 100;

const copy = defineCopy({
  en: {
    search: "Search by name or city",
    noMatch: (query: string) => `No university matches “${query}”.`,
    more: (n: number) => `${n} more — type to narrow it down`,
  },
  ru: {
    search: "Поиск по названию или городу",
    noMatch: (query: string) => `Ничего не найдено по запросу «${query}».`,
    more: (n: number) => `Ещё ${n} — начни вводить название`,
  },
});

/**
 * Picks one university out of hundreds: a button that opens a searchable
 * list, in place of a dropdown nobody can scroll through.
 */
export function UniversityCombobox({
  universities,
  value,
  onChange,
  placeholder,
  disabled = false,
  marked,
  markLabel,
  className,
}: {
  universities: CatalogUniversity[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** One university to tag in the list (the student's dream, for example). */
  marked?: string | null;
  markLabel?: string;
  className?: string;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = universities.find((u) => u.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? universities.filter((u) =>
          `${u.name} ${u.shortName} ${u.city} ${countryName(u.country, locale)}`.toLowerCase().includes(q),
        )
      : universities;
  }, [universities, query, locale]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            className={cn(
              "flex h-9 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
          />
        }
      >
        {selected ? (
          <>
            <UniversityLogo university={selected} className="size-5 shrink-0 rounded p-0.5 text-[0.5rem]" />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="truncate text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown className="ml-auto size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] gap-2 p-2">
        <div className="flex items-center gap-2 rounded-md border px-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {matches.slice(0, MAX_SHOWN).map((university) => (
            <button
              key={university.id}
              type="button"
              onClick={() => pick(university.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
                university.id === value && "bg-brand/10",
              )}
            >
              <UniversityLogo university={university} className="size-6 shrink-0 rounded-md p-0.5 text-[0.5rem]" />
              <span className="min-w-0">
                <span className="block truncate">
                  {university.name}
                  {university.id === marked && markLabel ? (
                    <span className="ml-1 text-xs text-[#e5484d]">{markLabel}</span>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{university.city}</span>
              </span>
              {university.id === value ? <Check className="ml-auto size-4 shrink-0 text-brand" /> : null}
            </button>
          ))}
          {matches.length > MAX_SHOWN ? (
            <p className="px-2 py-2 text-center text-xs text-muted-foreground">{t.more(matches.length - MAX_SHOWN)}</p>
          ) : null}
          {matches.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t.noMatch(query)}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
