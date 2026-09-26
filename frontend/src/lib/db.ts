import "server-only";
import { Pool, type PoolClient } from "pg";
import { env } from "@/lib/env.server";

/**
 * The one Postgres pool for the whole app: Better Auth's identity tables and
 * all domain data live in the same database. Schema changes go through
 * db/migrations (applied by `npm run db:migrate` and on every build) — never
 * through ad-hoc CREATE TABLE calls at request time.
 *
 * Cached on `globalThis` because Next.js dev mode hot-reloads this module and
 * would otherwise open a new pool, and new connections, on every save.
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
    // Serverless functions each hold their own pool; keep them small so a
    // burst of instances cannot exhaust a free-tier connection limit.
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pgPool;
}

/**
 * Runs `work` inside a single transaction on one connection, committing if it
 * resolves and rolling back if it throws.
 */
export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
