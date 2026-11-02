-- Cached AI admission-chance estimates.
--
-- An estimate depends only on the student's numbers, the university's
-- numbers, the program and the language, so the key is a hash of exactly
-- those (see lib/chance-calibration.ts). The same question asked again, from
-- another page or another day, costs a lookup instead of a model call. No
-- user id is stored: the key carries no identity and two students with the
-- same profile get the same answer. Rows older than 30 days are ignored and
-- trimmed now and then.

CREATE TABLE IF NOT EXISTS ai_chance_cache (
  cache_key varchar NOT NULL PRIMARY KEY,
  university_id varchar NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_chance_cache_created_at ON ai_chance_cache (created_at);
