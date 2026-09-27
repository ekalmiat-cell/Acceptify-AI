-- A revised draft points at the review of the draft before it, so a student
-- can see their score move across versions. Deleting an older review keeps
-- the newer ones; they simply lose the link.

ALTER TABLE essay_reviews
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES essay_reviews (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS ix_essay_reviews_parent_id ON essay_reviews (parent_id);
