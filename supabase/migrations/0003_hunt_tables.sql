-- ─── hunt_applications ───────────────────────────────────────────────────────
-- Tracks draw applications per user (stays in Deadline Tracker)

CREATE TABLE public.hunt_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  state TEXT NOT NULL,
  state_name TEXT NOT NULL,
  species TEXT NOT NULL,
  season TEXT NOT NULL,
  year INT NOT NULL,
  unit TEXT,

  status TEXT NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'drawn', 'not_drawn', 'withdrawn')),

  date_applied DATE,
  first_choice TEXT,
  second_choice TEXT,
  third_choice TEXT,
  notes TEXT,
  result_date DATE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, state, species, season, year)
);

ALTER TABLE public.hunt_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON public.hunt_applications
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER hunt_applications_updated_at
  BEFORE UPDATE ON public.hunt_applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── hunter_points ────────────────────────────────────────────────────────────
-- Self-reported bonus/preference points per state per species

CREATE TABLE public.hunter_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  state TEXT NOT NULL,
  state_name TEXT NOT NULL,
  species TEXT NOT NULL,
  season TEXT NOT NULL,
  points INT NOT NULL DEFAULT 0,
  point_type TEXT NOT NULL DEFAULT 'preference'
    CHECK (point_type IN ('preference', 'bonus')),
  notes TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, state, species, season)
);

ALTER TABLE public.hunter_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own points" ON public.hunter_points
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── hunt_plans ───────────────────────────────────────────────────────────────
-- Standalone hunt planning projects (OTC or drawn tags)

CREATE TABLE public.hunt_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  state TEXT NOT NULL,
  state_name TEXT NOT NULL,
  species TEXT NOT NULL,
  season TEXT NOT NULL,
  year INT NOT NULL,
  unit TEXT,

  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'booked', 'completed', 'cancelled')),

  trip_start_date DATE,
  trip_end_date DATE,
  trip_days INT,

  budget TEXT CHECK (budget IN ('under_500', '500_2000', '2000_5000', '5000_15000', '15000_plus')),
  terrain_difficulty TEXT CHECK (terrain_difficulty IN ('light', 'moderate', 'strenuous', 'extreme')),
  fly_or_drive TEXT CHECK (fly_or_drive IN ('fly', 'drive')),

  base_camp TEXT,
  base_camp_state TEXT,

  checklist JSONB NOT NULL DEFAULT '[]',
  ai_recommendations JSONB,
  ai_chat JSONB NOT NULL DEFAULT '[]',
  saved_services JSONB NOT NULL DEFAULT '[]',

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hunt_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON public.hunt_plans
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER hunt_plans_updated_at
  BEFORE UPDATE ON public.hunt_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
