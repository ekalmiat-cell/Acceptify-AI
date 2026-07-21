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
      {eyebrow ? (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase",
            dark
              ? "border-white/15 bg-white/5 text-brand"
              : "border-border bg-muted text-primary"
          )}
        >
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "max-w-2xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl",
          dark ? "text-white" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-xl text-balance text-base leading-relaxed sm:text-lg",
            dark ? "text-white/60" : "text-muted-foreground"
          )}
        >
          {description}
        </p>
      ) : null}
    </FadeIn>
  );
}
