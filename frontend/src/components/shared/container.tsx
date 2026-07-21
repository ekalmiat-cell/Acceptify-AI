import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Standard content width + horizontal padding used across the app. Keeps
 * page-level spacing consistent instead of every route re-deriving it.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-6 md:px-10", className)}
      {...props}
    />
  );
}
