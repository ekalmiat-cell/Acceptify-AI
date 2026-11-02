import { unstable_cache } from "next/cache";

import { runCopilotChat } from "@/lib/ai/copilot";
import { GeminiError } from "@/lib/ai/gemini";
import { aiStatus, configuredProviders, isMockAi, probeAi } from "@/lib/ai/llm";
import { adminEmails, isAdminUser } from "@/lib/admin";
import { recentAiErrors } from "@/lib/data/ai-errors";
import { pgPool } from "@/lib/db";
import { isMailConfigured, isMailDeliverable } from "@/lib/email";
import { env } from "@/lib/env.server";
import { json, route } from "@/lib/route";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Health check. Anyone gets a bare "is the database up" answer, which is all
 * an uptime monitor needs. The detail — migrations, mail and AI setup, recent
 * AI failures, Google's error text, the admin allow-list — is for the signed-in
 * admin only: it describes the deployment, and `?probe=1` spends the Gemini
 * quota, so neither belongs on an open URL.
 *
 * The probe does not run by default: the free tier is small and a live probe
 * costs five calls. Its result is cached for five minutes.
 */
const baseChecks = unstable_cache(
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

    // Whether students' requests reach the server at all, and how the
    // latest ones failed — counts and reasons only, nothing about who.
    let recent: Record<string, unknown> = {};
    try {
      const usage = await pgPool.query<{ feature: string; requests: string }>(
        `SELECT feature, sum(count)::text AS requests FROM ai_usage
         WHERE window_start > now() - interval '24 hours' AND user_id <> '__site__'
         GROUP BY feature`,
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
      // The admin allow-list, masked (ek***@gmail.com) — enough to spot a
      // typo, not enough to learn an address.
      admin: {
        allowListEntries: adminEmails().length,
        allowList: adminEmails().map((email) => email.replace(/^(.{2})[^@]*/, "$1***")),
        rawLength: env.ADMIN_EMAILS?.length ?? 0,
      },
      // Only the sender's domain: "resend.dev" means Resend's test sender,
      // which delivers to the Resend account owner and nobody else.
      email: {
        configured: isMailConfigured(),
        deliversToEveryone: isMailDeliverable(),
        senderDomain: process.env.EMAIL_FROM?.match(/@([^\s>]+)/)?.[1] ?? null,
      },
      ai: {
        ...aiStatus(),
      },
    };
  },
  ["health-check"],
  { revalidate: 30 },
);

/** Live calls to every model plus the copilot's real code path. */
const aiProbe = unstable_cache(
  async () => {
    if (isMockAi() || configuredProviders().length === 0) return { skipped: true, working: isMockAi() };

    const probes = await probeAi();
    const started = Date.now();
    let copilot: Record<string, unknown>;
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
    return { probedAt: new Date().toISOString(), probes, copilot, working: copilot.ok === true };
  },
  ["health-check-ai-probe"],
  { revalidate: 300 },
);

/** Just whether the database answers; cached so a flood of pings costs one query. */
const publicStatus = unstable_cache(
  async () => {
    try {
      await pgPool.query("SELECT 1");
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
  ["health-public"],
  { revalidate: 30 },
);

export const GET = route(async (request) => {
  const session = await getSession();
  if (!session || !isAdminUser(session.user)) {
    const status = await publicStatus();
    return json({ ...status, checkedAt: new Date().toISOString() }, status.ok ? 200 : 503);
  }

  const base = await baseChecks();
  if (new URL(request.url).searchParams.get("probe") !== "1") return json(base);
  return json({ ...base, ai: { ...base.ai, ...(await aiProbe()) } });
});
