import "server-only";
import { Pool } from "pg";
import { env } from "@/lib/env.server";

/**
 * Shared Postgres pool used by Better Auth to manage its own auth tables
 * (user, session, account, verification) in the same database the FastAPI
 * backend owns for domain data. One instance per server process — Next.js
 * dev mode hot-reloads this module, so the pool is cached on `globalThis`
 * to avoid exhausting Postgres connections on every reload.
 */
const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pgPool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    ssl:
      env.DATABASE_URL.includes("neon.tech") ||
      env.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pgPool;
}
