-- The whole Acceptify schema, written to be safe on three kinds of database:
--
--   1. an empty one (a fresh Neon branch, a new local Postgres),
--   2. one the retired FastAPI backend built with Alembic, and
--   3. one the interim Next.js routes half-built with CREATE TABLE IF NOT EXISTS.
--
-- Hence IF NOT EXISTS on every table, column and index, and index/constraint
-- names that match what Alembic generated, so case 2 gains nothing twice.

-- ── Better Auth ─────────────────────────────────────────────────────────────
-- Identity tables. Better Auth reads and writes them through `lib/auth.ts`;
-- nothing else in the app should touch them directly.

CREATE TABLE IF NOT EXISTS "user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL,
  "image" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" timestamptz NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

-- ── University catalog ─────────────────────────────────────────────────────
-- Reference data, seeded from src/data/universities.json by scripts/migrate.mjs.

CREATE TABLE IF NOT EXISTS universities (
  id varchar NOT NULL PRIMARY KEY,
  slug varchar NOT NULL,
  name varchar NOT NULL,
  short_name varchar NOT NULL,
  country varchar NOT NULL,
  city varchar NOT NULL,
  logo_initials varchar NOT NULL,
  world_ranking integer NOT NULL,
  national_ranking integer,
  acceptance_rate double precision NOT NULL,
  selectivity_level varchar NOT NULL,
  min_gpa double precision NOT NULL,
  sat_low integer NOT NULL,
  sat_high integer NOT NULL,
  act_min integer,
  act_max integer,
  ielts_min double precision NOT NULL,
  toefl_min integer NOT NULL,
  tuition_per_year_usd integer NOT NULL,
  living_cost_per_year_usd integer NOT NULL,
  scholarship_available boolean NOT NULL,
  scholarship_coverage varchar NOT NULL,
  application_deadline varchar NOT NULL,
  decision_type varchar NOT NULL,
  tags jsonb NOT NULL,
  description text NOT NULL,
  requirements jsonb NOT NULL,
  accept_rate_trend jsonb NOT NULL,
  gradient_from varchar NOT NULL,
  gradient_to varchar NOT NULL,
  website varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_universities_country ON universities (country);
CREATE UNIQUE INDEX IF NOT EXISTS ix_universities_slug ON universities (slug);

-- ── Programs and their scoring weights ─────────────────────────────────────
--   university -> program -> evaluation_profile -> evaluation_weight

CREATE TABLE IF NOT EXISTS programs (
  id varchar NOT NULL PRIMARY KEY,
  university_id varchar NOT NULL REFERENCES universities (id),
  slug varchar NOT NULL,
  name varchar NOT NULL,
  field varchar NOT NULL,
  parent_program_id varchar REFERENCES programs (id),
  level varchar NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_programs_university_id ON programs (university_id);
CREATE INDEX IF NOT EXISTS ix_programs_slug ON programs (slug);
CREATE INDEX IF NOT EXISTS ix_programs_field ON programs (field);

CREATE TABLE IF NOT EXISTS evaluation_profiles (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id varchar NOT NULL UNIQUE REFERENCES programs (id),
  name varchar NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_evaluation_profiles_program_id ON evaluation_profiles (program_id);

CREATE TABLE IF NOT EXISTS evaluation_weights (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_profile_id uuid NOT NULL REFERENCES evaluation_profiles (id),
  criterion_key varchar NOT NULL,
  weight double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_eval_weight_profile_criterion UNIQUE (evaluation_profile_id, criterion_key)
);

CREATE INDEX IF NOT EXISTS ix_evaluation_weights_evaluation_profile_id
  ON evaluation_weights (evaluation_profile_id);

-- Alembic created these id columns without a database default (it generated
-- UUIDs in Python). Raw SQL inserts rely on the database doing it.
ALTER TABLE evaluation_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE evaluation_weights ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE evaluation_profiles ALTER COLUMN is_active SET DEFAULT true;

-- ── Per-student data ───────────────────────────────────────────────────────
-- user_id holds Better Auth's "user".id. Deliberately no foreign key, to match
-- the databases Alembic already built; deleting a user cleans these up in
-- application code instead.

CREATE TABLE IF NOT EXISTS student_profiles (
  user_id varchar NOT NULL PRIMARY KEY,
  gpa double precision,
  sat_score integer,
  ielts_score double precision,
  toefl_score integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS act_score integer;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS ent_score integer;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dream_university_id varchar;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dream_program_id varchar;

CREATE TABLE IF NOT EXISTS achievements (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  key varchar NOT NULL,
  achieved boolean NOT NULL DEFAULT false,
  value varchar,
  level varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_achievements_user_id_key UNIQUE (user_id, key)
);

ALTER TABLE achievements ALTER COLUMN id SET DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS ix_achievements_user_id ON achievements (user_id);

CREATE TABLE IF NOT EXISTS predictions (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  university_id varchar NOT NULL,
  match_score integer NOT NULL,
  category varchar NOT NULL,
  status varchar NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- outcome is the calibration label: 'admitted' | 'rejected' | 'waitlisted' |
-- 'withdrawn', NULL until the student reports back.
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS outcome varchar;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS outcome_reported_at timestamptz;
ALTER TABLE predictions ALTER COLUMN id SET DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS ix_predictions_user_id ON predictions (user_id);
CREATE INDEX IF NOT EXISTS ix_predictions_outcome ON predictions (outcome);

CREATE TABLE IF NOT EXISTS essay_reviews (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  university_id varchar REFERENCES universities (id),
  program_id varchar,
  title varchar NOT NULL,
  prompt_text text,
  word_count integer NOT NULL,
  essay_snippet varchar(300) NOT NULL,
  essay_text text NOT NULL,
  analysis_result jsonb NOT NULL,
  overall_score integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE essay_reviews ALTER COLUMN id SET DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS ix_essay_reviews_user_id ON essay_reviews (user_id);
CREATE INDEX IF NOT EXISTS ix_essay_reviews_university_id ON essay_reviews (university_id);
CREATE INDEX IF NOT EXISTS ix_essay_reviews_overall_score ON essay_reviews (overall_score);
