-- ─── hunter_points: add created_at ───────────────────────────────────────────
-- Tracks when a points record was first entered so the system can detect
-- draw-year rollovers and auto-increment preference points on unsuccessful draws.

ALTER TABLE public.hunter_points
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── hunt_members: add updated_at ─────────────────────────────────────────────
-- Tracks when a hunt party member last had their record touched (tag status
-- changes, points updates, etc.) so we can display "last contributed" on cards.

ALTER TABLE public.hunt_members
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER hunt_members_updated_at
  BEFORE UPDATE ON public.hunt_members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
