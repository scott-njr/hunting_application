-- Journal sightings — field observations for the Journal page
-- Stores species sightings with auto-stamped weather/moon conditions

CREATE TABLE IF NOT EXISTS public.journal_sightings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species           TEXT        NOT NULL,
  point_count       INT,
  distance_yards    INT,
  direction         TEXT,
  animal_count      INT         NOT NULL DEFAULT 1,
  behavior          TEXT,
  notes             TEXT,
  lat               FLOAT8,
  lng               FLOAT8,
  location_name     TEXT,
  property_name     TEXT,
  observed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Conditions (auto-stamped at save time)
  temp_f            FLOAT8,
  wind_speed_mph    FLOAT8,
  wind_direction    TEXT,
  pressure_inhg     FLOAT8,
  pressure_trend    TEXT,
  moon_phase        TEXT,
  moon_illumination FLOAT8,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.journal_sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sightings" ON public.journal_sightings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER journal_sightings_updated_at
  BEFORE UPDATE ON public.journal_sightings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
