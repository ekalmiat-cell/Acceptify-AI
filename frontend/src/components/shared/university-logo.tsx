import Image from "next/image";

import logoIds from "@/data/university-logos.json";
import { cn } from "@/lib/utils";
import type { University } from "@/types/domain";

/** Universities whose site icon lives in public/university-logos/<id>.png. */
const withLogo = new Set<string>(logoIds);

type LogoUniversity = Pick<
  University,
  "id" | "name" | "logoInitials" | "gradientFrom" | "gradientTo"
>;

/**
 * A university's logo on a white tile (most icons are drawn for a light
 * background), or its initials on its brand gradient when no logo was found.
 * Logos are fetched once by scripts/fetch-university-logos.mjs and served
 * from this site.
 *
 * Size and corner radius come from `className` (e.g. "size-11 rounded-xl").
 */
export function UniversityLogo({
  university,
  className,
}: {
  university: LogoUniversity;
  className?: string;
}) {
  if (withLogo.has(university.id)) {
    return (
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 ring-1 ring-black/5",
          className,
        )}
      >
        <Image
          src={`/university-logos/${university.id}.png`}
          alt={`${university.name} logo`}
          width={128}
          height={128}
          unoptimized
          className="size-full object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-semibold text-white",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${university.gradientFrom}, ${university.gradientTo})`,
      }}
    >
      {university.logoInitials}
    </span>
  );
}
