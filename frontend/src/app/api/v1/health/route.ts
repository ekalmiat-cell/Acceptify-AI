import { unstable_cache } from "next/cache";

import { runCopilotChat } from "@/lib/ai/copilot";
import { candidateModels, GeminiError, isMockAi, probeModels } from "@/lib/ai/gemini";
import { recentAiErrors } from "@/lib/data/ai-errors";
import { pgPool } from "@/lib/db";
import { isMailConfigured, isMailDeliverable } from "@/lib/email";
import { env } from "@/lib/env.server";
import { json, route } from "@/lib/route";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

    // The copilot's real code path — system prompt, structured output and
    // reply validation — on a one-line conversation with no student data.
    let copilot: Record<string, unknown> = { ok: false, skipped: true };
    if (!isMockAi() && env.GEMINI_API_KEY) {
      const started = Date.now();
      try {
        const reply = await runCopilotChat(
          [{ role: "user", content: "Reply with a one-sentence greeting." }],
          null,
        );
        copilot = { ok: true, ms: Date.now() - started, replyPreview: reply.reply.slice(0, 80) };
      } catch (error) {
        copilot = {
          ok: false,
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
          upstream: error instanceof GeminiError ? error.upstream : null,
        };
      }
    }

    // Whether students' requests reach the server at all, and how the
    // latest ones failed — counts and reasons only, nothing about who.
    let recent: Record<string, unknown> = {};
    try {
      const usage = await pgPool.query<{ feature: string; requests: string }>(
        `SELECT feature, sum(count)::text AS requests FROM ai_usage
         WHERE window_start > now() - interval '24 hours' GROUP BY feature`,
      );
      recent = {
        requestsLast24h: Object.fromEntries(
          usage.rows.map((row) => [row.feature, Number(row.requests)]),
        ),
        errors: await recentAiErrors(10),
      };
    } catch (error) {
      recent = { error: error instanceof Error ? error.message : String(error) };
    }

    return {
      checkedAt: new Date().toISOString(),
      database,
      recent,
      // Only the sender's domain: "resend.dev" means Resend's test sender,
      // which delivers to the Resend account owner and nobody else.
      email: {
        configured: isMailConfigured(),
        deliversToEveryone: isMailDeliverable(),
        senderDomain: process.env.EMAIL_FROM?.match(/@([^\s>]+)/)?.[1] ?? null,
      },
      ai: {
        provider: env.AI_PROVIDER,
        apiKeySet: Boolean(env.GEMINI_API_KEY),
        configuredModel: env.GEMINI_MODEL ?? null,
        modelsTried: candidateModels(),
        probes,
        copilot,
        working: isMockAi() || copilot.ok === true,
      },
    };
  },
  ["health-check"],
  { revalidate: 30 },
);

export const GET = route(async () => json(await runChecks()));
