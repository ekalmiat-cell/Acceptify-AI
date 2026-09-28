-- The essay training course: which drills a student has finished, and how
-- many they did each day (for the streak and the daily goal). Drill content
-- lives in code (lib/training/drills.ts); only progress is stored here.

CREATE TABLE IF NOT EXISTS training_progress (
  user_id varchar NOT NULL,
  drill_id varchar(80) NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, drill_id)
);

CREATE TABLE IF NOT EXISTS training_days (
  user_id varchar NOT NULL,
  day date NOT NULL,
  drills integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
