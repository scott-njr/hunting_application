-- Gear inventory per user — stores equipment items for the Gear page
-- Gear can be linked to hunt plans via hunt_plans.gear_list (JSONB array of gear_item IDs)

-- ─── gear_items ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.gear_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  category    TEXT        NOT NULL DEFAULT 'other',
  brand       TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own gear" ON public.gear_items
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER gear_items_updated_at
  BEFORE UPDATE ON public.gear_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── hunt_plans: add gear_list ────────────────────────────────────────────────

-- JSONB array of gear_item UUIDs selected for this hunt plan
ALTER TABLE public.hunt_plans
  ADD COLUMN IF NOT EXISTS gear_list JSONB NOT NULL DEFAULT '[]';
