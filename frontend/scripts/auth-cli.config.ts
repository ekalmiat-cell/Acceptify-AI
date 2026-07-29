/**
 * Standalone Better Auth config for the `@better-auth/cli` only.
 *
 * The real config lives in `src/lib/auth.ts`, but that module (and everything
 * it imports) is guarded by `server-only`, which the CLI cannot resolve. This
 * file mirrors just the parts that determine the *database schema*:
 *
 *   - email/password  -> user, account, session, verification
 *   - the jwt plugin  -> jwks
 *
 * OAuth providers, session lifetimes, cookies and callbacks are deliberately
 * omitted: none of them change the tables. Keep this in sync with
 * src/lib/auth.ts whenever a plugin that owns tables is added or removed.
 *
 * Generate SQL:
 *   npx @better-auth/cli generate --config scripts/auth-cli.config.ts
 *
 * Apply straight to a database:
 *   $env:DATABASE_URL="postgresql://..."   # PowerShell
 *   npx @better-auth/cli migrate --config scripts/auth-cli.config.ts
 */
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgresql://localhost:5432/postgres",
  }),
  emailAndPassword: { enabled: true },
  plugins: [jwt()],
});
