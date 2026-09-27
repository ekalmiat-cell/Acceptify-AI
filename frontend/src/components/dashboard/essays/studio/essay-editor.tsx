"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, Eye, EyeOff, Maximize2, Minimize2, Upload } from "lucide-react";

import { HighlightTextarea, type Highlight } from "@/components/dashboard/essays/studio/highlight-textarea";
import { PromptPicker, UniversityPicker } from "@/components/dashboard/essays/studio/studio-pickers";
import { CUSTOM_PROMPT_ID, findPrompt } from "@/data/essay-prompts";
import type { CheckIssue, CheckKind, EssayCheck } from "@/lib/essay-check";
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

const KIND_LABEL: Record<CheckKind, string> = {
  cliche: "Overused phrase",
  passive: "Passive voice",
  filler: "Filler word",
  specific: "Strong detail",
};

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
      toast.error("That file is over 2 MB. Paste the text instead.");
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
        toast.error("Upload a .docx or .txt file — or copy the text from your PDF and paste it here.");
        return;
      }
      text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (!text) {
        toast.error("That file has no text in it.");
        return;
      }
      onChange({
        text,
        title: draft.title.trim() ? draft.title : file.name.replace(/\.[^/.]+$/, ""),
      });
      toast.success(`Loaded ${file.name}`);
    } catch {
      toast.error("Couldn't read that file. Copy the text and paste it here instead.");
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
          placeholder="Untitled essay"
          aria-label="Essay title"
          maxLength={200}
          className="mt-4 w-full bg-transparent font-heading text-xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 sm:text-2xl"
        />

        {prompt ? (
          <blockquote className="mt-3 border-l-[3px] border-brand pl-3.5">
            <p className="text-[11px] font-semibold tracking-wide text-brand uppercase">
              Your question{prompt.wordLimit ? ` · ${prompt.wordLimit} words max` : ""}
            </p>
            <p className="mt-0.5 font-serif text-[15px] leading-relaxed text-muted-foreground italic">
              {prompt.text}
            </p>
          </blockquote>
        ) : draft.promptId === CUSTOM_PROMPT_ID ? (
          <textarea
            value={draft.customPrompt}
            onChange={(event) => onChange({ customPrompt: event.target.value })}
            placeholder="Paste the essay question your university asks…"
            rows={2}
            maxLength={2000}
            className="mt-3 w-full resize-none rounded-lg border-l-[3px] border-brand bg-muted/30 px-3.5 py-2 font-serif text-[15px] italic outline-none placeholder:text-muted-foreground/70"
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/20 px-5 py-2 sm:px-6">
        <ToolbarChip active={liveCheck} onClick={onToggleLiveCheck}>
          {liveCheck ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          Live check
        </ToolbarChip>
        <ToolbarChip active={focusMode} onClick={onToggleFocus} className="hidden lg:inline-flex">
          {focusMode ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          Focus mode
        </ToolbarChip>
        <ToolbarChip onClick={() => fileInput.current?.click()}>
          <Upload className="size-3.5" />
          Upload .docx
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
            <p className="font-heading text-base font-semibold">Paste your essay or start writing</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ctrl+V pastes a finished draft. The live check marks overused phrases,
              passive voice and strong details as you go.
            </p>
          </div>
        ) : null}
        <HighlightTextarea
          id="essay-text"
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
              <span className="font-semibold">{KIND_LABEL[issueAtCaret.kind]}.</span>{" "}
              <span className="text-muted-foreground">{issueAtCaret.message}</span>
            </p>
          </div>
        ) : null}
      </div>

      <LengthMeter words={check.words} limit={prompt?.wordLimit ?? null} />
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

function LengthMeter({ words, limit }: { words: number; limit: number | null }) {
  if (!limit) {
    return (
      <div className="flex justify-between border-t px-5 py-3 text-xs text-muted-foreground sm:px-6">
        <span>Length</span>
        <span className="font-mono">
          {words} words · ~{Math.max(1, Math.round(words / 220))} min read
        </span>
      </div>
    );
  }

  const over = words > limit;
  const sweetFrom = Math.round(limit * 0.75);
  const fill = Math.min(100, (words / limit) * 100);

  return (
    <div className="border-t px-5 pt-3 pb-4 sm:px-6">
      <div className="mb-2 flex justify-between text-xs text-muted-foreground">
        <span>{over ? `${words - limit} words over the limit — cut before you submit` : "Length"}</span>
        <span className={cn("font-mono font-semibold", over ? "text-rose-400" : "text-foreground")}>
          {words} / {limit} words
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
          sweet spot {sweetFrom}–{limit}
        </span>
        <span>{limit}</span>
      </div>
    </div>
  );
}
