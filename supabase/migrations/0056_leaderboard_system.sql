-- Leaderboard points system + WOW community post enhancements

-- 1. Leaderboard points table (cumulative WOW points per user per week)
CREATE TABLE IF NOT EXISTS public.leaderboard_points (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id  UUID NOT NULL REFERENCES public.weekly_workouts(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  scaling     TEXT NOT NULL CHECK (scaling IN ('rx', 'scaled', 'beginner')),
  placement   INTEGER NOT NULL,
  points      INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workout_id, user_id)
);

ALTER TABLE public.leaderboard_points ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all leaderboard points
CREATE POLICY "Authenticated users can view leaderboard points"
  ON public.leaderboard_points FOR SELECT
  TO authenticated
  USING (true);

-- Indexes for leaderboard queries
CREATE INDEX idx_leaderboard_points_user ON public.leaderboard_points(user_id);
CREATE INDEX idx_leaderboard_points_week ON public.leaderboard_points(week_start DESC);
CREATE INDEX idx_leaderboard_points_workout ON public.leaderboard_points(workout_id);

-- 2. Add metadata JSONB to community_posts for rich WOW post rendering
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- 3. Add community_post_id FK on workout_submissions to link back to auto-post
ALTER TABLE public.workout_submissions
  ADD COLUMN IF NOT EXISTS community_post_id UUID REFERENCES public.community_posts(id) ON DELETE SET NULL;

-- 4. Update community_posts post_type CHECK to include wow_result + module-specific types
ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_post_type_check;

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_post_type_check
  CHECK (post_type IN (
    'discussion', 'unit_review', 'hunt_report', 'guide_review',
    'progress', 'gear_review', 'tip', 'catch_report', 'spot_review',
    'range_report', 'training_log', 'wow_result'
  ));
