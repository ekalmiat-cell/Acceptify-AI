import "server-only";
import { z } from "zod";

/**
 * Server-side environment. Values are read once, trimmed, and stripped of
 * stray quotes (a common copy-paste accident in the Vercel dashboard).
 *
 * Development gets working defaults for a local Postgres. Production does
 * not: a missing DATABASE_URL or BETTER_AUTH_SECRET there is reported the
 * moment something needs it (see `requireProductionValue`) instead of being
 * silently replaced by a value that happens to be public in this repo.
 */

function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

const isProductionRuntime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build";

function requireProductionValue(name: string, value: string | undefined, devDefault: string) {
  if (value) return value;
  if (isProductionRuntime) {
    throw new Error(`${name} is not set. Add it to the project's environment variables.`);
  }
  return devDefault;
}

const schema = z.object({
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  APPLE_APP_BUNDLE_IDENTIFIER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  // An unrecognised value falls back to the default instead of failing the
  // whole parse (which would drop every other variable with it).
  AI_PROVIDER: z.enum(["gemini", "mock"]).optional().catch(undefined),
});

const raw: Record<string, string | undefined> = Object.fromEntries(
  Object.keys(schema.shape).map((key) => [key, clean(process.env[key])]),
);

// Older deployments of this project set the Google credentials under these
// names; keep honouring them so an existing Vercel setup does not lose
// Google sign-in.
raw.GOOGLE_CLIENT_ID ??=
  clean(process.env.GOOGLE_ID) ?? clean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
raw.GOOGLE_CLIENT_SECRET ??= clean(process.env.GOOGLE_SECRET);

const parsed = schema.safeParse(raw);
if (!parsed.success) {
  console.warn("[env] ignoring invalid values:", z.prettifyError(parsed.error));
}
const values = parsed.success ? parsed.data : ({} as z.infer<typeof schema>);

export const env = {
  ...values,
  get DATABASE_URL(): string {
    return requireProductionValue(
      "DATABASE_URL",
      values.DATABASE_URL,
      "postgresql://acceptify:acceptify@localhost:5432/acceptify",
    );
  },
  get BETTER_AUTH_SECRET(): string {
    return requireProductionValue(
      "BETTER_AUTH_SECRET",
      values.BETTER_AUTH_SECRET,
      "local-development-secret-not-for-production",
    );
  },
  GEMINI_MODEL: values.GEMINI_MODEL ?? "gemini-3.7-flash",
  AI_PROVIDER: values.AI_PROVIDER ?? "gemini",
};
