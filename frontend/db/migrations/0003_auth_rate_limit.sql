-- Better Auth's brute-force limiter (rateLimit.storage = "database" in
-- src/lib/auth.ts). In memory it would reset on every serverless cold start
-- and not be shared between instances, which makes it nearly useless.

CREATE TABLE IF NOT EXISTS "rateLimit" (
  "id" text NOT NULL PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "count" integer NOT NULL,
  "lastRequest" bigint NOT NULL
);
