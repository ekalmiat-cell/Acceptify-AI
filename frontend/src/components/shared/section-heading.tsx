import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/shared/fade-in";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  dark?: boolean;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  dark = false,
}: SectionHeadingProps) {
  return (
    <FadeIn
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {/* The eyebrow reads like a file label on a dossier: mono, spaced, a red dot. */}
      {eyebrow ? (
        <span
          className={cn(
            "inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase",
            dark ? "text-mk-ink/55" : "text-muted-foreground"
          )}
        >
          <span className="size-1.5 rounded-full bg-[#e5484d]" />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "max-w-3xl text-balance font-display text-[1.9rem] leading-[1.15] font-bold tracking-tight sm:text-4xl md:text-[2.8rem]",
          dark ? "text-mk-ink" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-xl text-balance text-base leading-relaxed sm:text-lg",
            dark ? "text-mk-ink/60" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      ) : null}
    </FadeIn>
  );
}
