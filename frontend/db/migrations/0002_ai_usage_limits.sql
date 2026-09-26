-- Per-user counters for the AI features.
--
-- The app runs on Gemini's free tier, whose quota is shared by every user of
-- the deployment. Without a per-user ceiling one busy tab can spend the whole
-- day's quota and leave the essay reviewer broken for everybody else. Counts
-- live in Postgres rather than in memory because serverless instances come and
-- go and do not share memory.

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id varchar NOT NULL,
  feature varchar NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, feature, window_start)
);

CREATE INDEX IF NOT EXISTS ix_ai_usage_window_start ON ai_usage (window_start);
