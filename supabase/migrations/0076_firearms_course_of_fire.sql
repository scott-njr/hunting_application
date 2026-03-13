-- ─── Course of Fire Templates ──────────────────────────────────────────────────
-- Reusable test/drill definitions users create and load into the shot timer.

CREATE TABLE firearms_course_of_fire (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  strings_count   SMALLINT NOT NULL CHECK (strings_count BETWEEN 1 AND 10),
  shots_per_string SMALLINT NOT NULL CHECK (shots_per_string BETWEEN 1 AND 99),
  delay_mode      TEXT NOT NULL DEFAULT 'random' CHECK (delay_mode IN ('fixed', 'random', 'instant')),
  delay_min_ms    INT NOT NULL DEFAULT 2000,
  delay_max_ms    INT NOT NULL DEFAULT 5000,
  par_times_ms    INT[] NOT NULL DEFAULT '{}',
  created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_firearms_cof_user ON firearms_course_of_fire(user_id);

-- Updated_on trigger
CREATE TRIGGER set_firearms_cof_updated_on
  BEFORE UPDATE ON firearms_course_of_fire
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- RLS
ALTER TABLE firearms_course_of_fire ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses of fire"
  ON firearms_course_of_fire FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own courses of fire"
  ON firearms_course_of_fire FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses of fire"
  ON firearms_course_of_fire FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses of fire"
  ON firearms_course_of_fire FOR DELETE
  USING (auth.uid() = user_id);
