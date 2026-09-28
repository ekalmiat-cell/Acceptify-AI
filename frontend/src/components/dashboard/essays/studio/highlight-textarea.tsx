"use client";

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Highlight {
  start: number;
  end: number;
  className: string;
}

/**
 * A plain <textarea> with coloured marks drawn behind the text: a mirror
 * layer renders the same text, transparent, wrapping identically, with
 * <mark>s where the highlights are. Typing, pasting, undo and IME all stay
 * native. The textarea grows with its content, so the two layers never need
 * scroll syncing.
 */
export function HighlightTextarea({
  value,
  onChange,
  highlights,
  onCaretChange,
  placeholder,
  className,
  minHeight = 320,
  id,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  highlights: Highlight[];
  onCaretChange?: (position: number) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  id?: string;
  ariaLabel?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [value, minHeight]);

  const mirror = useMemo(() => renderMirror(value, highlights), [value, highlights]);

  // Shared by both layers so they wrap identically.
  const text = cn(
    "w-full whitespace-pre-wrap break-words font-serif text-[17px] leading-[1.85] px-6 py-5",
    className,
  );

  const reportCaret = () => {
    if (onCaretChange && textarea.current) onCaretChange(textarea.current.selectionStart);
  };

  return (
    <div className="relative">
      <div aria-hidden className={cn(text, "pointer-events-none absolute inset-0 text-transparent")}>
        {mirror}
      </div>
      <textarea
        id={id}
        ref={textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onSelect={reportCaret}
        onKeyUp={reportCaret}
        onClick={reportCaret}
        placeholder={placeholder}
        aria-label={ariaLabel}
        // Essays are written in English, whatever the interface language.
        lang="en"
        spellCheck
        style={{ minHeight }}
        className={cn(
          text,
          "relative block resize-none overflow-hidden bg-transparent text-foreground caret-brand outline-none placeholder:text-muted-foreground/70",
        )}
      />
    </div>
  );
}

function renderMirror(value: string, highlights: Highlight[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const [index, h] of highlights.entries()) {
    if (h.start < cursor || h.end > value.length || h.end <= h.start) continue;
    if (h.start > cursor) nodes.push(value.slice(cursor, h.start));
    nodes.push(
      // bg-transparent first: <mark> is yellow by default, and a highlight
      // that only underlines must not inherit that.
      <mark key={index} className={cn("rounded-[3px] bg-transparent text-transparent", h.className)}>
        {value.slice(h.start, h.end)}
      </mark>,
    );
    cursor = h.end;
  }
  nodes.push(value.slice(cursor));
  // A trailing newline needs a character after it to take up a line.
  nodes.push("​");
  return nodes;
}
