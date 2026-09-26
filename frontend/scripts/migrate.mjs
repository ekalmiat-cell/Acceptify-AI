/**
 * Brings the database up to date: applies every not-yet-applied file in
 * db/migrations (in name order, each in its own transaction), then seeds the
 * university catalog.
 *
 *   npm run db:migrate
 *
 * Also runs as the first step of `npm run build`, so a Vercel deploy migrates
 * the database it is about to talk to. With no DATABASE_URL at all (a build
 * that has no database, e.g. CI type-checking) it skips instead of failing;
 * with a DATABASE_URL that does not work, it fails the build — deploying code
 * against a schema it cannot have is worse than not deploying.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of [".env.local", ".env"]) {
  const envPath = path.join(root, file);
  if (existsSync(envPath)) process.loadEnvFile(envPath);
}

const connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  console.warn("[migrate] DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

const needsSsl =
  connectionString.includes("neon.tech") || connectionString.includes("sslmode=require");

const pool = new pg.Pool({
  connectionString,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  connectionTimeoutMillis: 15_000,
});

// Any constant works; it only has to be the same for every concurrent build.
const MIGRATION_LOCK_ID = 7_140_221;

async function applyMigrations(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name varchar PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await client.query("SELECT name FROM schema_migrations")).rows.map((row) => row.name),
  );

  const dir = path.join(root, "db", "migrations");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const name of files) {
    if (applied.has(name)) continue;

    const sql = readFileSync(path.join(dir, name), "utf8");
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      await client.query("COMMIT");
      console.log(`[migrate] applied ${name}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${name} failed: ${error.message}`);
    }
  }
}

/**
 * Inserts catalog universities the database does not have yet. Existing rows
 * are left alone, so a value corrected directly in the database is not
 * overwritten by the snapshot on the next deploy.
 */
async function seedUniversities(client) {
  const universities = JSON.parse(
    readFileSync(path.join(root, "src", "data", "universities.json"), "utf8"),
  );

  let inserted = 0;
  for (const u of universities) {
    const result = await client.query(
      `INSERT INTO universities (
         id, slug, name, short_name, country, city, logo_initials,
         world_ranking, national_ranking, acceptance_rate, selectivity_level,
         min_gpa, sat_low, sat_high, act_min, act_max, ielts_min, toefl_min,
         tuition_per_year_usd, living_cost_per_year_usd, scholarship_available,
         scholarship_coverage, application_deadline, decision_type,
         tags, description, requirements, accept_rate_trend,
         gradient_from, gradient_to, website
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
         $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
       )
       ON CONFLICT (id) DO NOTHING`,
      [
        u.id, u.slug, u.name, u.shortName, u.country, u.city, u.logoInitials,
        u.worldRanking, u.nationalRanking, u.acceptanceRate, u.selectivityLevel,
        u.minGpa, u.satLow, u.satHigh, u.actMin, u.actMax, u.ieltsMin, u.toeflMin,
        u.tuitionPerYearUsd, u.livingCostPerYearUsd, u.scholarshipAvailable,
        u.scholarshipCoverage, u.applicationDeadline, u.decisionType,
        JSON.stringify(u.tags), u.description, JSON.stringify(u.requirements),
        JSON.stringify(u.acceptRateTrend), u.gradientFrom, u.gradientTo, u.website,
      ],
    );
    inserted += result.rowCount ?? 0;
  }

  console.log(
    `[migrate] universities: ${inserted} added, ${universities.length - inserted} already present`,
  );
}

const client = await pool.connect();
try {
  // Two deploys building at once must not both run the same migration.
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);
  await applyMigrations(client);
  await seedUniversities(client);
  console.log("[migrate] database is up to date");
} catch (error) {
  console.error(`[migrate] ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]).catch(() => {});
  client.release();
  await pool.end();
}
