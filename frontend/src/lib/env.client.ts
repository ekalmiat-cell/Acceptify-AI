import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1)
    .default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1)
    .default("http://localhost:8000"),
});

function getClientEnv() {
  const fallbackAppUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : "http://localhost:3000";

  const raw = {
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || fallbackAppUrl,
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      NEXT_PUBLIC_APP_URL: fallbackAppUrl,
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
    };
  }

  return parsed.data;
}

/**
 * Validated browser-safe environment with bulletproof fallbacks for Vercel builds.
 */
export const clientEnv = getClientEnv();
