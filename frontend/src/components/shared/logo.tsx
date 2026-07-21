import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-heading text-base font-semibold", className)}>
      <span className="bg-gradient-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-white shadow-glow-brand">
        <Sparkles className="size-4" />
      </span>
      <span className={dark ? "text-white" : "text-foreground"}>
        Acceptify <span className="text-brand">AI</span>
      </span>
    </span>
  );
}
