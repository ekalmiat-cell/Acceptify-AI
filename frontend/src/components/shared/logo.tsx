import Image from "next/image";

import { cn } from "@/lib/utils";

/** The same mark as the installed app's icon (public/icons, app/manifest.ts). */
export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading text-base font-semibold", className)}>
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={192}
        height={192}
        unoptimized
        priority
        className="size-7 shrink-0 rounded-lg ring-1 ring-white/10"
      />
      <span className={dark ? "text-white" : "text-foreground"}>
        Acceptify <span className="text-brand">AI</span>
      </span>
    </span>
  );
}
