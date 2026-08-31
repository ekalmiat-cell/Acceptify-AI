import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1).default("postgresql://postgres:root@localhost:5432/acceptify"),
  BETTER_AUTH_SECRET: z.string().min(1).default("default-dev-secret-32-chars-long-min"),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: z.string().min(1).default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().min(1).default("http://localhost:8000"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  APPLE_APP_BUNDLE_IDENTIFIER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

function getParsedEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.warn("Server environment warning:", result.error.format());
    return {
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:root@localhost:5432/acceptify",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || "default-dev-secret-32-chars-long-min",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
      APPLE_CLIENT_SECRET: process.env.APPLE_CLIENT_SECRET,
      APPLE_APP_BUNDLE_IDENTIFIER: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      EMAIL_FROM: process.env.EMAIL_FROM,
      ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    };
  }
  return result.data;
}

export const env = getParsedEnv();
