import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { heroStats } from "@/data/stats";

const points = [
  "AI predictions across 500+ universities",
  "Safe / Target / Reach in one dashboard",
  "16 achievement categories tracked for you",
];

export function AuthPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#071326] p-12 lg:flex">
      <div className="bg-grid-glow pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />

      <div className="relative">
        <Logo dark />
      </div>

      <div className="relative flex flex-col gap-8">
        <blockquote className="max-w-md text-balance font-heading text-2xl leading-snug text-white">
          &ldquo;I stopped guessing and started applying strategically —
          every school on my list made sense.&rdquo;
        </blockquote>
        <div className="flex flex-col gap-3">
          {points.map((point) => (
            <div key={point} className="flex items-center gap-2.5 text-sm text-white/70">
              <CheckCircle2 className="size-4 shrink-0 text-brand" />
              {point}
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid grid-cols-4 gap-6 border-t border-white/10 pt-6">
        {heroStats.map((stat) => (
          <div key={stat.id}>
            <p className="font-heading text-xl font-semibold text-white">
              {stat.value}
              {stat.suffix}
            </p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
