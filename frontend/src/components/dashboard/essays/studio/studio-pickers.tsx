"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, FileQuestion, Globe2, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UniversityLogo } from "@/components/shared/university-logo";
import { CUSTOM_PROMPT_ID, ESSAY_PROMPTS } from "@/data/essay-prompts";
import { countryName } from "@/lib/countries";
import { defineCopy, plural } from "@/lib/i18n/core";
import { useCopy, useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";

const copy = defineCopy({
  en: {
    optional: "optional",
    university: "University",
    anyUniversity: "Any university",
    anyUniversityNote: "A general essay — the AI skips university fit",
    search: (n: number) => `Search ${n} universities`,
    noMatch: (query: string) => `No university matches “${query}”.`,
    question: "Essay question",
    ownQuestion: "My own question",
    ownQuestionNote: "Paste the question your university asks",
    noQuestion: "No specific question",
    noQuestionNote: "Reviewed as a general personal statement",
    groups: { "Common App": "Common App", "University-specific": "University-specific" },
    words: (n: number) => `${n} words`,
  },
  ru: {
    optional: "необязательно",
    university: "Университет",
    anyUniversity: "Любой университет",
    anyUniversityNote: "Общее эссе — ИИ не оценивает соответствие университету",
    search: (n: number) => `Поиск среди ${n} ${plural("ru", n, { one: "университета", few: "университетов", many: "университетов" })}`,
    noMatch: (query: string) => `Ничего не найдено по запросу «${query}».`,
    question: "Вопрос эссе",
    ownQuestion: "Свой вопрос",
    ownQuestionNote: "Вставь вопрос, который задаёт твой университет",
    noQuestion: "Без конкретного вопроса",
    noQuestionNote: "Разбор как общего личного эссе",
    groups: { "Common App": "Common App", "University-specific": "Вопросы университетов" },
    words: (n: number) => `${n} ${plural("ru", n, { one: "слово", few: "слова", many: "слов" })}`,
  },
});

/** The labelled box both pickers open from. */
function PickerTrigger({ label, children }: { label: string; children: ReactNode }) {
  const t = useCopy(copy);
  return (
    <PopoverTrigger
      render={
        <button
          type="button"
          className="group relative flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-xl border bg-muted/30 px-3.5 py-2 text-left transition-colors hover:border-brand/50 hover:bg-brand/5 data-popup-open:border-brand/60"
        />
      }
    >
      <span className="text-[11px] font-semibold text-muted-foreground">
        {label} <span className="font-normal opacity-70">· {t.optional}</span>
      </span>
      <span className="flex w-full min-w-0 items-center gap-2 pr-6 text-sm font-semibold">
        {children}
      </span>
      <ChevronDown className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground transition-transform group-data-popup-open:rotate-180" />
    </PopoverTrigger>
  );
}

function Option({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
        selected && "bg-brand/10",
      )}
    >
      {children}
      {selected ? <Check className="ml-auto size-4 shrink-0 text-brand" /> : null}
    </button>
  );
}

export function UniversityPicker({
  universities,
  value,
  onChange,
}: {
  universities: University[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useCopy(copy);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = universities.find((u) => u.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? universities.filter((u) =>
          `${u.name} ${u.shortName} ${u.city} ${u.country} ${countryName(u.country, locale)}`.toLowerCase().includes(q),
        )
      : universities;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [universities, query, locale]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger label={t.university}>
        {selected ? (
          <>
            <UniversityLogo university={selected} className="size-5 rounded p-0.5 text-[0.5rem]" />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Globe2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">{t.anyUniversity}</span>
          </>
        )}
      </PickerTrigger>
      <PopoverContent align="start" className="w-80 gap-2 p-2">
        <div className="flex items-center gap-2 rounded-md border px-2.5">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search(universities.length)}
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {!query ? (
            <Option selected={!value} onSelect={() => pick(null)}>
              <Globe2 className="size-5 shrink-0 text-muted-foreground" />
              <span>
                {t.anyUniversity}
                <span className="block text-xs text-muted-foreground">{t.anyUniversityNote}</span>
              </span>
            </Option>
          ) : null}
          {matches.map((university) => (
            <Option
              key={university.id}
              selected={university.id === value}
              onSelect={() => pick(university.id)}
            >
              <UniversityLogo university={university} className="size-6 rounded-md p-0.5 text-[0.5rem]" />
              <span className="min-w-0">
                <span className="block truncate">{university.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {university.city}, {countryName(university.country, locale)}
                </span>
              </span>
            </Option>
          ))}
          {matches.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t.noMatch(query)}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PromptPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useCopy(copy);
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const selected = ESSAY_PROMPTS.find((p) => p.id === value) ?? null;
  const groups = ["Common App", "University-specific"] as const;

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger label={t.question}>
        <FileQuestion className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {selected
            ? `${selected.group === "Common App" ? "Common App · " : ""}${selected.label[locale]}`
            : value === CUSTOM_PROMPT_ID
              ? t.ownQuestion
              : t.noQuestion}
        </span>
      </PickerTrigger>
      <PopoverContent align="start" className="w-96 gap-1 p-2">
        <div className="max-h-96 overflow-y-auto">
          <Option selected={!value} onSelect={() => pick(null)}>
            <span>
              {t.noQuestion}
              <span className="block text-xs text-muted-foreground">{t.noQuestionNote}</span>
            </span>
          </Option>
          {groups.map((group) => (
            <div key={group} className="mt-1">
              <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {t.groups[group]}
              </p>
              {ESSAY_PROMPTS.filter((p) => p.group === group).map((prompt) => (
                <Option key={prompt.id} selected={prompt.id === value} onSelect={() => pick(prompt.id)}>
                  <span className="min-w-0">
                    <span className="block">{prompt.label[locale]}</span>
                    <span className="block line-clamp-1 text-xs text-muted-foreground">
                      {prompt.wordLimit ? `${t.words(prompt.wordLimit)} · ` : ""}
                      <span lang="en">{prompt.text}</span>
                    </span>
                  </span>
                </Option>
              ))}
            </div>
          ))}
          <div className="mt-1 border-t pt-1">
            <Option selected={value === CUSTOM_PROMPT_ID} onSelect={() => pick(CUSTOM_PROMPT_ID)}>
              <span>
                {t.ownQuestion}
                <span className="block text-xs text-muted-foreground">{t.ownQuestionNote}</span>
              </span>
            </Option>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
