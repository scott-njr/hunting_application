-- Journal pins — map waypoints for the Journal mapping feature
-- Supports all pin types: sightings, sign, trail cams, terrain, infrastructure
-- Type-specific data stored in metadata JSONB column

CREATE TABLE IF NOT EXISTS public.journal_pins (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_type          TEXT        NOT NULL,
  lat               FLOAT8      NOT NULL,
  lng               FLOAT8      NOT NULL,
  label             TEXT,
  notes             TEXT,
  color             TEXT,
  metadata          JSONB       NOT NULL DEFAULT '{}',
  observed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Auto-stamped conditions
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
ALTER TABLE public.journal_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pins" ON public.journal_pins
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER journal_pins_updated_at
  BEFORE UPDATE ON public.journal_pins
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
