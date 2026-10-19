import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { KaspiPayDialog } from "@/components/pricing/kaspi-pay-dialog";
import { cn, formatTenge } from "@/lib/utils";
import { defineCopy, type Locale } from "@/lib/i18n/core";
import type { PricingTier } from "@/types/domain";

const copy = defineCopy({
  en: { best: "Best value", month: "month", oneTime: "one-time", was: "was" },
  ru: { best: "Выгоднее всего", month: "месяц", oneTime: "разово", was: "было" },
});

/** A plan on paper: ink for the highlighted one, a red-pen discount on paid ones. */
export function PricingCard({ tier, locale }: { tier: PricingTier; locale: Locale }) {
  const t = copy[locale];
  const ink = tier.highlighted;
  const off = tier.oldPrice ? Math.round((1 - tier.price / tier.oldPrice) * 100) : 0;

  return (
    <div
      className={cn(
        "hover-lift relative flex h-full flex-col gap-6 rounded-3xl border p-8",
        ink
          ? "border-mk-ink bg-mk-ink text-mk-bg shadow-[0_24px_50px_-30px_rgba(11,31,58,0.8)]"
          : "border-mk-ink/10 bg-mk-surface text-mk-ink",
      )}
    >
      {ink ? (
        <span className="absolute -top-3 left-8 rounded-full bg-[#2f6feb] px-3 py-1 font-mono text-[11px] font-semibold tracking-wider text-white uppercase">
          {t.best}
        </span>
      ) : null}
      {off > 0 ? (
        <span
          aria-hidden
          className="absolute top-6 right-6 rotate-[8deg] rounded-md border-[3px] border-[#e5484d] px-2 py-0.5 font-display text-sm font-bold tracking-wider text-[#e5484d]"
        >
          −{off}%
        </span>
      ) : null}

      <div className={cn(off > 0 && "pr-16")}>
        <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
        <p className={cn("mt-1 text-sm", ink ? "text-mk-bg/70" : "text-mk-ink/55")}>{tier.description}</p>
      </div>

      <div>
        {tier.oldPrice ? (
          <p className={cn("flex items-baseline gap-2 text-sm", ink ? "text-mk-bg/60" : "text-mk-ink/50")}>
            {t.was}
            <span className="font-mono text-base line-through decoration-[#e5484d] decoration-2">
              {formatTenge(tier.oldPrice, locale)}
            </span>
          </p>
        ) : null}
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading text-4xl font-semibold tabular-nums">{formatTenge(tier.price, locale)}</span>
          <span className={cn("text-sm", ink ? "text-mk-bg/60" : "text-mk-ink/45")}>
            / {tier.billingPeriod === "month" ? t.month : t.oneTime}
          </span>
        </div>
      </div>

      {tier.price > 0 ? (
        <KaspiPayDialog
          tier={tier}
          locale={locale}
          triggerClassName={cn(
            "h-10 w-full",
            ink ? "bg-mk-bg text-mk-ink hover:bg-mk-bg/90" : "bg-mk-ink text-mk-bg hover:bg-mk-ink/90",
          )}
        />
      ) : (
        <Button
          render={<Link href="/sign-up" />}
          variant="outline"
          className={cn("h-10 w-full", ink && "border-mk-bg/30 bg-transparent text-mk-bg hover:bg-mk-bg/10")}
        >
          {tier.cta}
        </Button>
      )}

      <ul className="flex flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className={cn("mt-0.5 size-4 shrink-0", ink ? "text-[#7fa8ff]" : "text-[#2f6feb]")} />
            <span className={ink ? "text-mk-bg/85" : "text-mk-ink/70"}>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
