-- Weekly Workouts & Submissions for Workout of the Week (WOW)

-- ─── Weekly Workouts ────────────────────────────────────────────────────────────

CREATE TABLE weekly_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  workout_details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE weekly_workouts ENABLE ROW LEVEL SECURITY;

-- Anyone can read workouts (public display on Nav2 page)
CREATE POLICY "weekly_workouts_select" ON weekly_workouts
  FOR SELECT USING (true);

-- Only service role can insert/update (AI generation endpoint)
-- No user-facing insert/update policy needed

-- ─── Workout Submissions ────────────────────────────────────────────────────────

CREATE TABLE workout_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES weekly_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scaling TEXT NOT NULL CHECK (scaling IN ('rx', 'scaled', 'beginner')),
  score_value INTEGER NOT NULL,
  score_display TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workout_id, user_id)
);

ALTER TABLE workout_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all submissions (leaderboard)
CREATE POLICY "workout_submissions_select" ON workout_submissions
  FOR SELECT TO authenticated USING (true);

-- Users can insert their own submissions
CREATE POLICY "workout_submissions_insert" ON workout_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own submissions
CREATE POLICY "workout_submissions_update" ON workout_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own submissions
CREATE POLICY "workout_submissions_delete" ON workout_submissions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for leaderboard queries
CREATE INDEX idx_workout_submissions_workout ON workout_submissions(workout_id, score_value ASC);
CREATE INDEX idx_workout_submissions_user ON workout_submissions(user_id);
