import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PricingTier } from "@/types/domain";

export function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-6 rounded-3xl p-8",
        tier.highlighted
          ? "bg-gradient-brand shadow-glow-brand text-white"
          : "glass-panel text-white"
      )}
    >
      {tier.highlighted ? (
        <span className="absolute -top-3 left-8 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0b1f3a]">
          Most popular
        </span>
      ) : null}

      <div>
        <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
        <p className={cn("mt-1 text-sm", tier.highlighted ? "text-white/80" : "text-white/50")}>
          {tier.description}
        </p>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-4xl font-semibold">
          ${tier.price}
        </span>
        <span className={cn("text-sm", tier.highlighted ? "text-white/75" : "text-white/45")}>
          / {tier.billingPeriod === "month" ? "month" : "one-time"}
        </span>
      </div>

      <Button
        render={<Link href="/sign-up" />}
        className={cn(
          "h-10 w-full",
          tier.highlighted
            ? "bg-white text-[#0b1f3a] hover:bg-white/90"
            : "bg-white/10 text-white hover:bg-white/20"
        )}
      >
        {tier.cta}
      </Button>

      <ul className="flex flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check
              className={cn(
                "mt-0.5 size-4 shrink-0",
                tier.highlighted ? "text-white" : "text-brand"
              )}
            />
            <span className={tier.highlighted ? "text-white/90" : "text-white/70"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
