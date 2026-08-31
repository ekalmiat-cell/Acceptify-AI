import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { achievementCatalog } from "@/data/achievement-catalog";
import { ACADEMIC_CRITERIA } from "@/lib/criteria";
import { FIELDS_OF_STUDY } from "@/lib/fields-of-study";

/**
 * Deliberately static: the sign-in screen must render even when the API is
 * unreachable, so the figures here come from constants shipped with the app
 * rather than a catalog fetch. Nothing on this panel is a usage or outcome
 * claim — see data/stats.ts for the same rule on the landing page.
 */
const points = [
  "A fit score for a specific university and programme",
  "A score breakdown that shows what helped and what held you back",
  "An action plan built from the gaps in your own profile",
];

const facts = [
  { id: "academics", value: String(ACADEMIC_CRITERIA.length), label: "academic inputs" },
  { id: "achievements", value: String(achievementCatalog.length), label: "achievement categories" },
  { id: "fields", value: String(FIELDS_OF_STUDY.length), label: "fields of study" },
];

export function AuthPanel() {
  return (
    <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#071326] p-12 lg:flex">
      <div className="bg-grid-glow pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative">
        <Logo dark />
      </div>

      <div className="relative flex flex-col gap-8">
        <p className="max-w-md text-balance font-heading text-2xl leading-snug text-white">
          Know your chances. Build your path.
        </p>
        <div className="flex flex-col gap-3">
          {points.map((point) => (
            <div key={point} className="flex items-start gap-2.5 text-sm text-white/70">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" />
              {point}
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
        {facts.map((fact) => (
          <div key={fact.id}>
            <p className="font-heading text-xl font-semibold text-white">{fact.value}</p>
            <p className="text-xs text-white/40">{fact.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
