"use client";

import { Globe2, History, Loader2, Sparkles } from "lucide-react";

import { KIND_DOT } from "@/components/dashboard/essays/studio/essay-editor";
import { UniversityLogo } from "@/components/shared/university-logo";
import { Switch } from "@/components/ui/switch";
import { AI_REVIEWS_PER_HOUR } from "@/lib/ai-limits";
import type { EssayCheck } from "@/lib/essay-check";
import { CRITERIA } from "@/lib/essay-rubric";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";
import type { FeedbackLanguage } from "@/types/essay";

export const MIN_WORDS = 25;

export function StudioSidebar({
  university,
  check,
  liveCheck,
  includeProfile,
  onIncludeProfile,
  language,
  onLanguage,
  reviewsLeft,
  revisingScore,
  isReviewing,
  onReview,
}: {
  university: University | null;
  check: EssayCheck;
  liveCheck: boolean;
  includeProfile: boolean;
  onIncludeProfile: (value: boolean) => void;
  language: FeedbackLanguage;
  onLanguage: (value: FeedbackLanguage) => void;
  reviewsLeft: number;
  /** Score of the draft being revised, when this is a revision. */
  revisingScore: number | null;
  isReviewing: boolean;
  onReview: () => void;
}) {
  const tooShort = check.words < MIN_WORDS;
  const outOfReviews = reviewsLeft <= 0;

  return (
    <div className="flex flex-col gap-4">
      <UniversityCard university={university} />
      <LiveCheckCard check={check} enabled={liveCheck} />

      <section className="rounded-2xl border bg-card p-4">
        <h3 className="text-sm font-semibold">The AI review scores</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {CRITERIA.map((c) => (
            <li key={c.key} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-32 shrink-0 text-muted-foreground">{c.short}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-brand/70" style={{ width: `${c.weight * 4}%` }} />
              </span>
              <span className="w-8 text-right font-mono text-xs text-muted-foreground">{c.weight}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Plus sentence-by-sentence comments, a paragraph map and the three changes worth the
          most points{university ? `, and how well you fit ${university.shortName}` : ""}.
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-medium">Use my profile</span>
            <span className="block text-xs text-muted-foreground">Field of study and achievements, never your name</span>
          </span>
          <Switch checked={includeProfile} onCheckedChange={onIncludeProfile} />
        </label>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">Feedback language</span>
          <div className="flex rounded-full border p-0.5 text-xs font-semibold">
            {(["en", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => onLanguage(code)}
                aria-pressed={language === code}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors",
                  language === code ? "bg-brand text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {code === "en" ? "English" : "Русский"}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div>
        <button
          type="button"
          onClick={onReview}
          disabled={isReviewing || tooShort || outOfReviews}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-4 py-3.5 text-[15px] font-semibold text-white shadow-glow-brand transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReviewing ? <Loader2 className="size-4 animate-spin" /> : revisingScore !== null ? <History className="size-4" /> : <Sparkles className="size-4" />}
          {revisingScore !== null ? "Review revised draft" : "Review with AI"}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tooShort
            ? `Write at least ${MIN_WORDS} words to get a review.`
            : outOfReviews
              ? "You've used this hour's reviews. They refill at the top of the hour."
              : revisingScore !== null
                ? `Compared with your last draft (${revisingScore}/100) · ${reviewsLeft} of ${AI_REVIEWS_PER_HOUR} reviews left this hour`
                : `About 30 seconds · ${reviewsLeft} of ${AI_REVIEWS_PER_HOUR} reviews left this hour`}
        </p>
      </div>
    </div>
  );
}

function UniversityCard({ university }: { university: University | null }) {
  if (!university) {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-dashed bg-card/50 p-4">
        <Globe2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Any university.</span> The AI reviews it as a
          general essay. Pick a university above to also check how well you fit it.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <UniversityLogo university={university} className="size-12 rounded-xl text-xs" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{university.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {university.city}, {university.country}
          </p>
        </div>
      </div>
      {university.tags.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {university.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand/25 bg-brand/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function LiveCheckCard({ check, enabled }: { check: EssayCheck; enabled: boolean }) {
  const { metrics } = check;
  const rows = [
    { label: "Overused phrases", value: metrics.cliches, dot: KIND_DOT.cliche, bad: metrics.cliches > 0 },
    { label: "Passive voice", value: metrics.passive, dot: KIND_DOT.passive, bad: metrics.passive > 0 },
    { label: "Filler words", value: metrics.fillers, dot: KIND_DOT.filler, bad: metrics.fillers > 3 },
    {
      label: "Sentence rhythm",
      value: metrics.variety === "good" ? "Good" : metrics.variety === "ok" ? "OK" : "Flat",
      dot: metrics.variety === "low" ? "bg-amber-400" : "bg-emerald-400",
      bad: metrics.variety === "low",
    },
    {
      label: "Sentences starting with “I”",
      value: metrics.iStarts,
      dot: "bg-slate-400",
      bad: check.sentences >= 5 && metrics.iStarts / check.sentences > 0.35,
    },
    { label: "Strong details", value: metrics.specifics, dot: KIND_DOT.specific, bad: false },
  ];

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Live check</h3>
        <span className="text-[11px] text-muted-foreground">instant · no AI</span>
      </div>
      {!enabled ? (
        <p className="mt-2 text-sm text-muted-foreground">Turned off. Switch it on above the essay.</p>
      ) : check.words < MIN_WORDS ? (
        <p className="mt-2 text-sm text-muted-foreground">Starts checking once you have a few sentences.</p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {check.quickFixes === 0 ? (
              <span className="text-emerald-400">No quick fixes left — ready for the AI review.</span>
            ) : (
              <>
                <span className="font-semibold">
                  {check.quickFixes} quick {check.quickFixes === 1 ? "fix" : "fixes"}
                </span>{" "}
                <span className="text-muted-foreground">
                  to make before you spend an AI review. Click a highlight to see why.
                </span>
              </>
            )}
          </p>
          <ul className="mt-3 flex flex-col">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-2.5 border-t py-1.5 text-[13px] first:border-t-0">
                <span className={cn("size-2 shrink-0 rounded-full", row.dot)} />
                <span className="flex-1 text-muted-foreground">{row.label}</span>
                <span className={cn("font-mono text-xs font-semibold", row.bad && "text-amber-400")}>
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
