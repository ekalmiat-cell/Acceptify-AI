-- Universities added from public data (the US College Scorecard) come with
-- real admission rates, test ranges and costs, but without the figures that
-- data set does not publish: a minimum GPA, IELTS/TOEFL bars, deadlines, a
-- world ranking, scholarships for international students. Those stay NULL
-- ("no data") instead of being guessed.
ALTER TABLE universities
  ALTER COLUMN world_ranking DROP NOT NULL,
  ALTER COLUMN min_gpa DROP NOT NULL,
  ALTER COLUMN sat_low DROP NOT NULL,
  ALTER COLUMN sat_high DROP NOT NULL,
  ALTER COLUMN ielts_min DROP NOT NULL,
  ALTER COLUMN toefl_min DROP NOT NULL,
  ALTER COLUMN tuition_per_year_usd DROP NOT NULL,
  ALTER COLUMN living_cost_per_year_usd DROP NOT NULL,
  ALTER COLUMN scholarship_available DROP NOT NULL,
  ALTER COLUMN scholarship_coverage DROP NOT NULL,
  ALTER COLUMN application_deadline DROP NOT NULL,
  ALTER COLUMN decision_type DROP NOT NULL;

-- Search by name across a catalog of hundreds.
CREATE INDEX IF NOT EXISTS ix_universities_name_lower ON universities (lower(name));
