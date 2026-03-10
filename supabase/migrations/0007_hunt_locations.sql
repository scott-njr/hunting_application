-- ─── hunt_locations ────────────────────────────────────────────────────────────
-- Named scouting locations per hunt plan (Location A, B, C…).
-- Each location stores optional GPS coordinates and its own AI scout report,
-- so a single hunt plan can have independent reports for multiple spots.

CREATE TABLE IF NOT EXISTS public.hunt_locations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_plan_id UUID       NOT NULL REFERENCES public.hunt_plans(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL DEFAULT 'Location A',
  description TEXT,
  lat         NUMERIC(10, 6),
  lng         NUMERIC(10, 6),
  scout_report JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.hunt_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own hunt locations" ON public.hunt_locations
  USING (
    hunt_plan_id IN (
      SELECT id FROM public.hunt_plans WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    hunt_plan_id IN (
      SELECT id FROM public.hunt_plans WHERE user_id = auth.uid()
    )
  );

-- Auto-update updated_at
CREATE TRIGGER hunt_locations_updated_at
  BEFORE UPDATE ON public.hunt_locations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
