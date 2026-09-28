"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, Eye, EyeOff, Maximize2, Minimize2, Upload } from "lucide-react";

import { HighlightTextarea, type Highlight } from "@/components/dashboard/essays/studio/highlight-textarea";
import { PromptPicker, UniversityPicker } from "@/components/dashboard/essays/studio/studio-pickers";
import { CUSTOM_PROMPT_ID, findPrompt } from "@/data/essay-prompts";
import type { CheckIssue, CheckKind, EssayCheck } from "@/lib/essay-check";
import { defineCopy, plural, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";

export interface EssayDraft {
  title: string;
  universityId: string | null;
  promptId: string | null;
  customPrompt: string;
  text: string;
}

export const HIGHLIGHT_CLASS: Record<CheckKind, string> = {
  cliche: "bg-amber-400/20 shadow-[inset_0_-2px_0_0_rgb(251_191_36)]",
  passive: "bg-rose-400/15 shadow-[inset_0_-2px_0_0_rgb(251_113_133)]",
  filler: "shadow-[inset_0_-2px_0_0_rgb(148_163_184_/_0.7)]",
  specific: "bg-emerald-400/10 shadow-[inset_0_-2px_0_0_rgb(52_211_153_/_0.8)]",
};

const words = (locale: Locale, n: number) =>
  `${n} ${plural(locale, n, locale === "ru" ? { one: "слово", few: "слова", many: "слов" } : { one: "word", other: "words" })}`;

const copy = defineCopy({
  en: {
    kinds: { cliche: "Overused phrase", passive: "Passive voice", filler: "Filler word", specific: "Strong detail" },
    tooBig: "That file is over 2 MB. Paste the text instead.",
    wrongType: "Upload a .docx or .txt file — or copy the text from your PDF and paste it here.",
    emptyFile: "That file has no text in it.",
    loaded: (name: string) => `Loaded ${name}`,
    unreadable: "Couldn't read that file. Copy the text and paste it here instead.",
    untitled: "Untitled essay",
    titleLabel: "Essay title",
    yourQuestion: "Your question",
    wordsMax: (n: number) => `${n} words max`,
    customPlaceholder: "Paste the essay question your university asks…",
    liveCheck: "Live check",
    focusMode: "Focus mode",
    upload: "Upload .docx",
    emptyTitle: "Paste your essay or start writing",
    emptyNote:
      "Ctrl+V pastes a finished draft. The live check marks overused phrases, passive voice and strong details as you go.",
    textLabel: "Essay text (in English)",
    length: "Length",
    minRead: (words: number) => `~${Math.max(1, Math.round(words / 220))} min read`,
    over: (n: string) => `${n} over the limit — cut before you submit`,
    ofLimit: (n: number, limit: number) => `${n} / ${limit} words`,
    sweetSpot: (from: number, to: number) => `sweet spot ${from}–${to}`,
  },
  ru: {
    kinds: { cliche: "Заезженная фраза", passive: "Пассивный залог", filler: "Слово-паразит", specific: "Сильная деталь" },
    tooBig: "Файл больше 2 МБ. Вставь текст вручную.",
    wrongType: "Загрузи файл .docx или .txt — или скопируй текст из PDF и вставь сюда.",
    emptyFile: "В этом файле нет текста.",
    loaded: (name: string) => `Загружено: ${name}`,
    unreadable: "Не удалось прочитать файл. Скопируй текст и вставь его сюда.",
    untitled: "Эссе без названия",
    titleLabel: "Название эссе",
    yourQuestion: "Твой вопрос",
    wordsMax: (n: number) => `не больше ${n} слов`,
    customPlaceholder: "Вставь вопрос эссе, который задаёт твой университет…",
    liveCheck: "Живая проверка",
    focusMode: "Режим фокуса",
    upload: "Загрузить .docx",
    emptyTitle: "Вставь эссе или начни писать",
    emptyNote:
      "Ctrl+V вставит готовый черновик. Живая проверка сразу отмечает заезженные фразы, пассивный залог и сильные детали.",
    textLabel: "Текст эссе (на английском)",
    length: "Объём",
    minRead: (words: number) => `~${Math.max(1, Math.round(words / 220))} мин чтения`,
    over: (n: string) => `На ${n} больше лимита — сократи перед подачей`,
    ofLimit: (n: number, limit: number) => `${n} / ${limit} ${plural("ru", limit, { one: "слово", few: "слова", many: "слов" })}`,
    sweetSpot: (from: number, to: number) => `оптимально ${from}–${to}`,
  },
});

export const KIND_DOT: Record<CheckKind, string> = {
  cliche: "bg-amber-400",
  passive: "bg-rose-400",
  filler: "bg-slate-400",
  specific: "bg-emerald-400",
};

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

export function EssayEditor({
  draft,
  onChange,
  universities,
  check,
  liveCheck,
  onToggleLiveCheck,
  focusMode,
  onToggleFocus,
  savedLabel,
}: {
  draft: EssayDraft;
  onChange: (patch: Partial<EssayDraft>) => void;
  universities: University[];
  check: EssayCheck;
  liveCheck: boolean;
  onToggleLiveCheck: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  savedLabel: string | null;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const fileInput = useRef<HTMLInputElement>(null);
  const [caret, setCaret] = useState<number | null>(null);
  const prompt = findPrompt(draft.promptId);

  const highlights: Highlight[] = useMemo(
    () =>
      liveCheck
        ? check.issues.map((issue) => ({
            start: issue.start,
            end: issue.end,
            className: HIGHLIGHT_CLASS[issue.kind],
          }))
        : [],
    [check.issues, liveCheck],
  );

  // The comment for whatever the cursor is standing in.
  const issueAtCaret: CheckIssue | null =
    liveCheck && caret !== null
      ? (check.issues.find((i) => caret >= i.start && caret <= i.end) ?? null)
      : null;

  async function handleFile(file: File) {
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(t.tooBig);
      return;
    }
    const name = file.name.toLowerCase();
    try {
      let text: string;
      if (name.endsWith(".docx")) {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        text = result.value;
      } else if (name.endsWith(".txt") || name.endsWith(".md")) {
        text = await file.text();
      } else {
        toast.error(t.wrongType);
        return;
      }
      text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!text) {
        toast.error(t.emptyFile);
        return;
      }
      onChange({
        text,
        title: draft.title.trim() ? draft.title : file.name.replace(/\.[^/.]+$/, ""),
      });
      toast.success(t.loaded(file.name));
    } catch {
      toast.error(t.unreadable);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-5 pt-5 pb-4 sm:px-6">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <UniversityPicker
            universities={universities}
            value={draft.universityId}
            onChange={(universityId) => onChange({ universityId })}
          />
          <PromptPicker value={draft.promptId} onChange={(promptId) => onChange({ promptId })} />
        </div>

        <input
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder={t.untitled}
          aria-label={t.titleLabel}
          maxLength={200}
          className="mt-4 w-full bg-transparent font-heading text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-2xl"
        />

        {prompt ? (
          <blockquote className="mt-3 border-l-[3px] border-brand pl-3.5">
            <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">
              {t.yourQuestion}
              {prompt.wordLimit ? ` · ${t.wordsMax(prompt.wordLimit)}` : ""}
            </p>
            <p lang="en" className="mt-0.5 font-serif text-[15px] leading-relaxed text-muted-foreground italic">
              {prompt.text}
            </p>
          </blockquote>
        ) : draft.promptId === CUSTOM_PROMPT_ID ? (
          <textarea
            value={draft.customPrompt}
            onChange={(event) => onChange({ customPrompt: event.target.value })}
            placeholder={t.customPlaceholder}
            rows={2}
            maxLength={2000}
            className="mt-3 w-full resize-none rounded-lg border-l-[3px] border-brand bg-muted/30 px-3.5 py-2 font-serif text-[15px] italic outline-none placeholder:text-muted-foreground/70"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-5 py-2 sm:px-6">
        <ToolbarChip active={liveCheck} onClick={onToggleLiveCheck}>
          {liveCheck ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {t.liveCheck}
        </ToolbarChip>
        <ToolbarChip active={focusMode} onClick={onToggleFocus} className="hidden lg:inline-flex">
          {focusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          {t.focusMode}
        </ToolbarChip>
        <ToolbarChip onClick={() => fileInput.current?.click()}>
          <Upload className="size-3.5" />
          {t.upload}
        </ToolbarChip>
        <input
          ref={fileInput}
          type="file"
          accept=".docx,.txt,.md"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void handleFile(file);
            event.target.value = "";
          }}
        />
        {savedLabel ? (
          <span className="ml-auto text-xs text-muted-foreground">{savedLabel}</span>
        ) : null}
      </div>

      <div className="relative">
        {!draft.text ? (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex flex-col items-center gap-2 px-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ClipboardPaste className="size-5" />
            </span>
            <p className="font-heading text-base font-semibold">{t.emptyTitle}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t.emptyNote}</p>
          </div>
        ) : null}
        <HighlightTextarea
          id="essay-text"
          ariaLabel={t.textLabel}
          value={draft.text}
          onChange={(text) => onChange({ text })}
          highlights={highlights}
          onCaretChange={setCaret}
          minHeight={focusMode ? 520 : 360}
        />
        {issueAtCaret ? (
          <div className="mx-5 mb-3 flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3 py-2 text-sm sm:mx-6">
            <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", KIND_DOT[issueAtCaret.kind])} />
            <p>
              <span className="font-semibold">{t.kinds[issueAtCaret.kind]}.</span>{" "}
              <span className="text-muted-foreground">{issueAtCaret.message[locale]}</span>
            </p>
          </div>
        ) : null}
      </div>

      <LengthMeter locale={locale} words={check.words} limit={prompt?.wordLimit ?? null} />
    </section>
  );
}

function ToolbarChip({
  active,
  onClick,
  className,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground",
        active && "border-brand/50 bg-brand/10 text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

function LengthMeter({ locale, words: count, limit }: { locale: Locale; words: number; limit: number | null }) {
  const t = copy[locale];
  if (!limit) {
    return (
      <div className="flex justify-between border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
        <span>{t.length}</span>
        <span className="font-mono">
          {words(locale, count)} · {t.minRead(count)}
        </span>
      </div>
    );
  }

  const over = count > limit;
  const sweetFrom = Math.round(limit * 0.75);
  const fill = Math.min(100, (count / limit) * 100);

  return (
    <div className="border-t px-5 pt-3 pb-4 sm:px-6">
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>{over ? t.over(words(locale, count - limit)) : t.length}</span>
        <span className={cn("font-mono font-semibold", over ? "text-rose-400" : "text-foreground")}>
          {t.ofLimit(count, limit)}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 rounded-full border border-dashed border-emerald-400/50 bg-emerald-400/10"
          style={{ left: `${(sweetFrom / limit) * 100}%`, right: 0 }}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width] duration-300",
            over ? "bg-rose-400" : "bg-gradient-to-r from-[#2159cd] to-[#4a8bff]",
          )}
          style={{ width: `${fill}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>0</span>
        <span className="text-emerald-400/80">
          {t.sweetSpot(sweetFrom, limit)}
        </span>
        <span>{limit}</span>
      </div>
    </div>
  );
}
