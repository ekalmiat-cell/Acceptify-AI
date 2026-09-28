"use client";

import { Globe2, History, Loader2, Sparkles } from "lucide-react";

import { KIND_DOT } from "@/components/dashboard/essays/studio/essay-editor";
import { UniversityLogo } from "@/components/shared/university-logo";
import { Switch } from "@/components/ui/switch";
import { AI_REVIEWS_PER_DAY } from "@/lib/ai-limits";
import { countryName } from "@/lib/countries";
import type { EssayCheck } from "@/lib/essay-check";
import { CRITERIA } from "@/lib/essay-rubric";
import { criterionShort } from "@/lib/essay-rubric-copy";
import { defineCopy, plural, type Locale } from "@/lib/i18n/core";
import { useLocale } from "@/lib/i18n/client";
import { tagName } from "@/lib/university-copy";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";

export const MIN_WORDS = 25;

const copy = defineCopy({
  en: {
    scores: "The AI review scores",
    extras: (university: string | null) =>
      `Plus sentence-by-sentence comments, a paragraph map and the three changes worth the most points${
        university ? `, and how well you fit ${university}` : ""
      }.`,
    useProfile: "Use my profile",
    useProfileNote: "Field of study and achievements, never your name",
    reviewRevised: "Review revised draft",
    review: "Review with AI",
    tooShort: `Write at least ${MIN_WORDS} words to get a review.`,
    outOfReviews: "You've used today's reviews. They refill tomorrow — the live check still works.",
    comparedWith: (score: number, left: number, total: number) =>
      `Compared with your last draft (${score}/100) · ${left} of ${total} reviews left today`,
    about: (left: number, total: number) => `About 30 seconds · ${left} of ${total} reviews left today`,
    anyUniversity: "Any university.",
    anyUniversityNote: "The AI reviews it as a general essay. Pick a university above to also check how well you fit it.",
    liveCheck: "Live check",
    instant: "instant · no AI",
    off: "Turned off. Switch it on above the essay.",
    notYet: "Starts checking once you have a few sentences.",
    ready: "No quick fixes left — ready for the AI review.",
    quickFixes: (n: number) => `${n} quick ${n === 1 ? "fix" : "fixes"}`,
    quickFixesNote: "to make before you spend an AI review. Click a highlight to see why.",
    rows: {
      cliches: "Overused phrases",
      passive: "Passive voice",
      fillers: "Filler words",
      rhythm: "Sentence rhythm",
      iStarts: "Sentences starting with “I”",
      specifics: "Strong details",
    },
    variety: { good: "Good", ok: "OK", low: "Flat" },
  },
  ru: {
    scores: "Что оценивает ИИ",
    extras: (university: string | null) =>
      `А ещё — комментарии к предложениям, карта абзацев и три правки, которые дадут больше всего баллов${
        university ? `, и насколько ты подходишь ${university}` : ""
      }.`,
    useProfile: "Учитывать мой профиль",
    useProfileNote: "Направление и достижения, но не твоё имя",
    reviewRevised: "Разобрать новую версию",
    review: "Разбор с ИИ",
    tooShort: `Напиши хотя бы ${MIN_WORDS} слов, чтобы получить разбор.`,
    outOfReviews: "Разборы на сегодня закончились. Они обновятся завтра — живая проверка работает и так.",
    comparedWith: (score: number, left: number, total: number) =>
      `Сравним с прошлым черновиком (${score}/100) · осталось ${left} из ${total} разборов на сегодня`,
    about: (left: number, total: number) => `Около 30 секунд · осталось ${left} из ${total} разборов на сегодня`,
    anyUniversity: "Любой университет.",
    anyUniversityNote:
      "ИИ разберёт эссе как общее. Выбери университет выше, чтобы проверить ещё и то, насколько ты ему подходишь.",
    liveCheck: "Живая проверка",
    instant: "сразу · без ИИ",
    off: "Выключена. Включи её над текстом эссе.",
    notYet: "Начнёт проверять, когда будет хотя бы несколько предложений.",
    ready: "Быстрых правок не осталось — можно отправлять на разбор ИИ.",
    quickFixes: (n: number) =>
      `${n} ${plural("ru", n, { one: "быстрая правка", few: "быстрые правки", many: "быстрых правок" })}`,
    quickFixesNote: "стоит сделать до разбора ИИ. Нажми на подсветку, чтобы узнать почему.",
    rows: {
      cliches: "Заезженные фразы",
      passive: "Пассивный залог",
      fillers: "Слова-паразиты",
      rhythm: "Ритм предложений",
      iStarts: "Предложения с «I» в начале",
      specifics: "Сильные детали",
    },
    variety: { good: "Хороший", ok: "Нормальный", low: "Монотонный" },
  },
});

type Copy = (typeof copy)["en"];

export function StudioSidebar({
  university,
  check,
  liveCheck,
  includeProfile,
  onIncludeProfile,
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
  reviewsLeft: number;
  /** Score of the draft being revised, when this is a revision. */
  revisingScore: number | null;
  isReviewing: boolean;
  onReview: () => void;
}) {
  const locale = useLocale();
  const t = copy[locale];
  const tooShort = check.words < MIN_WORDS;
  const outOfReviews = reviewsLeft <= 0;

  return (
    <div className="flex flex-col gap-4">
      <UniversityCard t={t} locale={locale} university={university} />
      <LiveCheckCard t={t} check={check} enabled={liveCheck} />

      <section className="rounded-2xl border bg-card p-4">
        <h3 className="text-sm font-semibold">{t.scores}</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {CRITERIA.map((c) => (
            <li key={c.key} className="flex items-center gap-2.5 text-[13px]">
              <span className="w-32 shrink-0 text-muted-foreground">{criterionShort(c.key, locale)}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-brand/70" style={{ width: `${c.weight * 4}%` }} />
              </span>
              <span className="w-8 text-right font-mono text-xs text-muted-foreground">{c.weight}%</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          {t.extras(university ? university.shortName : null)}
        </p>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            <span className="font-medium">{t.useProfile}</span>
            <span className="block text-xs text-muted-foreground">{t.useProfileNote}</span>
          </span>
          <Switch checked={includeProfile} onCheckedChange={onIncludeProfile} />
        </label>
      </section>

      <div>
        <button
          type="button"
          onClick={onReview}
          disabled={isReviewing || tooShort || outOfReviews}
          className="btn-shine flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand px-4 py-3.5 text-[15px] font-semibold text-white shadow-glow-brand transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isReviewing ? <Loader2 className="size-4 animate-spin" /> : revisingScore !== null ? <History className="size-4" /> : <Sparkles className="size-4" />}
          {revisingScore !== null ? t.reviewRevised : t.review}
        </button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {tooShort
            ? t.tooShort
            : outOfReviews
              ? t.outOfReviews
              : revisingScore !== null
                ? t.comparedWith(revisingScore, reviewsLeft, AI_REVIEWS_PER_DAY)
                : t.about(reviewsLeft, AI_REVIEWS_PER_DAY)}
        </p>
      </div>
    </div>
  );
}

function UniversityCard({ t, locale, university }: { t: Copy; locale: Locale; university: University | null }) {
  if (!university) {
    return (
      <section className="flex items-start gap-3 rounded-2xl border border-dashed bg-card/50 p-4">
        <Globe2 className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{t.anyUniversity}</span> {t.anyUniversityNote}
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
            {university.city}, {countryName(university.country, locale)}
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
              {tagName(tag, locale)}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function LiveCheckCard({ t, check, enabled }: { t: Copy; check: EssayCheck; enabled: boolean }) {
  const { metrics } = check;
  const rows = [
    { label: t.rows.cliches, value: metrics.cliches, dot: KIND_DOT.cliche, bad: metrics.cliches > 0 },
    { label: t.rows.passive, value: metrics.passive, dot: KIND_DOT.passive, bad: metrics.passive > 0 },
    { label: t.rows.fillers, value: metrics.fillers, dot: KIND_DOT.filler, bad: metrics.fillers > 3 },
    {
      label: t.rows.rhythm,
      value: t.variety[metrics.variety],
      dot: metrics.variety === "low" ? "bg-amber-400" : "bg-emerald-400",
      bad: metrics.variety === "low",
    },
    {
      label: t.rows.iStarts,
      value: metrics.iStarts,
      dot: "bg-slate-400",
      bad: check.sentences >= 5 && metrics.iStarts / check.sentences > 0.35,
    },
    { label: t.rows.specifics, value: metrics.specifics, dot: KIND_DOT.specific, bad: false },
  ];

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{t.liveCheck}</h3>
        <span className="text-[11px] text-muted-foreground">{t.instant}</span>
      </div>
      {!enabled ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.off}</p>
      ) : check.words < MIN_WORDS ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.notYet}</p>
      ) : (
        <>
          <p className="mt-2 text-sm">
            {check.quickFixes === 0 ? (
              <span className="text-emerald-400">{t.ready}</span>
            ) : (
              <>
                <span className="font-semibold">{t.quickFixes(check.quickFixes)}</span>{" "}
                <span className="text-muted-foreground">{t.quickFixesNote}</span>
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
