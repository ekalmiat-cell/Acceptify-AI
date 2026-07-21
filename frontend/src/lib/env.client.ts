import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_API_URL: z.url(),
});

/**
 * Validated browser-safe environment. Only NEXT_PUBLIC_* vars belong here —
 * Next.js inlines these into the client bundle at build time, so nothing
 * secret can live in this file.
 */
export const clientEnv = schema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});
