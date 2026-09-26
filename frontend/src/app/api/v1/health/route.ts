import { unstable_cache } from "next/cache";

import { candidateModels, isMockAi, probeModels } from "@/lib/ai/gemini";
import { pgPool } from "@/lib/db";
import { env } from "@/lib/env.server";
import { json, route } from "@/lib/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Public health check: can this deployment reach its database, is it
 * migrated, and can its Gemini key actually use a model?
 *
 * Public so a broken deployment can be diagnosed without signing in. It
 * reveals no secrets — only whether they are set, migration names, and
 * Google's error text — and the result is cached for a minute so the probe
 * cannot be used to burn the shared AI quota.
 */
const runChecks = unstable_cache(
  async () => {
    const database: Record<string, unknown> = {};
    try {
      const migrations = await pgPool.query<{ name: string }>(
        "SELECT name FROM schema_migrations ORDER BY name",
      );
      const aiUsage = await pgPool.query("SELECT to_regclass('public.ai_usage') AS t");
      database.ok = true;
      database.migrations = migrations.rows.map((row) => row.name);
      database.aiUsageTable = Boolean(aiUsage.rows[0]?.t);
    } catch (error) {
      database.ok = false;
      database.error = error instanceof Error ? error.message : String(error);
    }

    const probes = isMockAi() || !env.GEMINI_API_KEY ? [] : await probeModels();

    return {
      checkedAt: new Date().toISOString(),
      database,
      ai: {
        provider: env.AI_PROVIDER,
        apiKeySet: Boolean(env.GEMINI_API_KEY),
        configuredModel: env.GEMINI_MODEL ?? null,
        modelsTried: candidateModels(),
        probes,
        working: isMockAi() || probes.some((probe) => probe.ok),
      },
    };
  },
  ["health-check"],
  { revalidate: 60 },
);

export const GET = route(async () => json(await runChecks()));
