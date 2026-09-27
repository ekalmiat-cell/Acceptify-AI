"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, FileQuestion, Globe2, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UniversityLogo } from "@/components/shared/university-logo";
import { CUSTOM_PROMPT_ID, ESSAY_PROMPTS } from "@/data/essay-prompts";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";

/** The labelled box both pickers open from. */
function PickerTrigger({ label, children }: { label: string; children: ReactNode }) {
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
        {label} <span className="font-normal opacity-70">· optional</span>
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = universities.find((u) => u.id === value) ?? null;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? universities.filter((u) =>
          `${u.name} ${u.shortName} ${u.city} ${u.country}`.toLowerCase().includes(q),
        )
      : universities;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [universities, query]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger label="University">
        {selected ? (
          <>
            <UniversityLogo university={selected} className="size-5 rounded p-0.5 text-[0.5rem]" />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <>
            <Globe2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">Any university</span>
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
            placeholder="Search 239 universities"
            className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-72 overflow-y-auto">
          {!query ? (
            <Option selected={!value} onSelect={() => pick(null)}>
              <Globe2 className="size-5 shrink-0 text-muted-foreground" />
              <span>
                Any university
                <span className="block text-xs text-muted-foreground">
                  A general essay — the AI skips university fit
                </span>
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
                  {university.city}, {university.country}
                </span>
              </span>
            </Option>
          ))}
          {matches.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">No university matches “{query}”.</p>
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
  const [open, setOpen] = useState(false);
  const selected = ESSAY_PROMPTS.find((p) => p.id === value) ?? null;
  const groups = ["Common App", "University-specific"] as const;

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PickerTrigger label="Essay question">
        <FileQuestion className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {selected
            ? `${selected.group === "Common App" ? "Common App · " : ""}${selected.label}`
            : value === CUSTOM_PROMPT_ID
              ? "My own question"
              : "No specific question"}
        </span>
      </PickerTrigger>
      <PopoverContent align="start" className="w-96 gap-1 p-2">
        <div className="max-h-96 overflow-y-auto">
          <Option selected={!value} onSelect={() => pick(null)}>
            <span>
              No specific question
              <span className="block text-xs text-muted-foreground">Reviewed as a general personal statement</span>
            </span>
          </Option>
          {groups.map((group) => (
            <div key={group} className="mt-1">
              <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {group}
              </p>
              {ESSAY_PROMPTS.filter((p) => p.group === group).map((prompt) => (
                <Option key={prompt.id} selected={prompt.id === value} onSelect={() => pick(prompt.id)}>
                  <span className="min-w-0">
                    <span className="block">{prompt.label}</span>
                    <span className="block line-clamp-1 text-xs text-muted-foreground">
                      {prompt.wordLimit ? `${prompt.wordLimit} words · ` : ""}
                      {prompt.text}
                    </span>
                  </span>
                </Option>
              ))}
            </div>
          ))}
          <div className="mt-1 border-t pt-1">
            <Option selected={value === CUSTOM_PROMPT_ID} onSelect={() => pick(CUSTOM_PROMPT_ID)}>
              <span>
                My own question
                <span className="block text-xs text-muted-foreground">Paste the question your university asks</span>
              </span>
            </Option>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
