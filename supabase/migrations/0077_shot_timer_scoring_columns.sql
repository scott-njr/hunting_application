-- Add scoring columns to firearms_shot_session
-- USPSA-style hit zone scoring is overall course-level (instructor reviews all targets)

ALTER TABLE firearms_shot_session
  ADD COLUMN course_name TEXT,
  ADD COLUMN status TEXT CHECK (status IN ('review', 'dq', 'dnf')) DEFAULT 'review',
  ADD COLUMN procedurals SMALLINT DEFAULT 0,
  ADD COLUMN additional_penalty SMALLINT DEFAULT 0,
  ADD COLUMN hit_factor NUMERIC(8,4),
  ADD COLUMN shots_per_string SMALLINT,
  ADD COLUMN alpha SMALLINT DEFAULT 0,
  ADD COLUMN bravo SMALLINT DEFAULT 0,
  ADD COLUMN charlie SMALLINT DEFAULT 0,
  ADD COLUMN delta SMALLINT DEFAULT 0,
  ADD COLUMN miss SMALLINT DEFAULT 0,
  ADD COLUMN band_thresholds JSONB DEFAULT '[100,100,100,100,100]';
