-- Recent failures of the AI features, so a broken copilot or essay reviewer
-- can be diagnosed from the health check without access to server logs.
-- Deliberately stores no user id and no message content — only what failed
-- and why. Old rows are trimmed by the application.

CREATE TABLE IF NOT EXISTS ai_error_log (
  id bigserial PRIMARY KEY,
  feature varchar NOT NULL,
  status integer NOT NULL,
  message text NOT NULL,
  upstream text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_error_log_created_at ON ai_error_log (created_at);
