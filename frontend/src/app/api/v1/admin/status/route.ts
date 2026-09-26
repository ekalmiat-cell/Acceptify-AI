import { candidateModels, isMockAi, probeModels } from "@/lib/ai/gemini";
import { pgPool } from "@/lib/db";
import { env } from "@/lib/env.server";
import { isMailConfigured } from "@/lib/email";
import { json, requireAdmin, route } from "@/lib/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Admin-only health check: is the database migrated, and which Gemini models
 * does this deployment's API key actually have access to? Answers the "the
 * AI doesn't work" question with Google's own error message instead of a
 * guess. Never includes secret values — only whether they are set.
 */
export const GET = route(async () => {
  await requireAdmin();

  const database: Record<string, unknown> = {};
  try {
    const migrations = await pgPool.query<{ name: string }>(
      "SELECT name FROM schema_migrations ORDER BY name",
    );
    const universities = await pgPool.query<{ count: string }>(
      "SELECT count(*) FROM universities",
    );
    database.ok = true;
    database.migrations = migrations.rows.map((row) => row.name);
    database.universities = Number(universities.rows[0].count);
  } catch (error) {
    database.ok = false;
    database.error = error instanceof Error ? error.message : String(error);
  }

  const probes = isMockAi() ? [] : await probeModels();

  return json({
    database,
    ai: {
      provider: env.AI_PROVIDER,
      apiKeySet: Boolean(env.GEMINI_API_KEY),
      configuredModel: env.GEMINI_MODEL ?? null,
      modelsTried: candidateModels(),
      probes,
      working: probes.some((probe) => probe.ok),
    },
    email: { configured: isMailConfigured() },
    googleSignIn: { configured: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) },
  });
});
