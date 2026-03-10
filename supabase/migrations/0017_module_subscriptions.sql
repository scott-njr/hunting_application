-- Platform module system
-- Adds `modules` reference table and `module_subscriptions` per-user per-module tier rows
-- Replaces single global membership_tier with module × tier matrix pricing
-- Each module has: free (limited), basic (core features), pro (full + AI)
-- Stripe will be wired per-module-product in Phase 2

-- ─── modules ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.modules (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,             -- lucide icon name for UI rendering
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- Seed the five planned platform modules
INSERT INTO public.modules (slug, name, description, icon, sort_order) VALUES
  ('hunting',  'Hunting',  'Draw deadlines, hunt planning, gear, and AI scouting reports.', 'Tent',      1),
  ('firearms', 'Firearms', 'Ballistics, maintenance logs, and range tracking.',             'Crosshair', 2),
  ('medical',  'Medical',  'Wilderness first aid protocols and emergency preparedness.',    'Heart',     3),
  ('fishing',  'Fishing',  'Fly fishing, spear fishing, regulations, and trip logs.',       'Fish',      4),
  ('fitness',  'Fitness',  'Hunt-specific fitness training and conditioning programs.',     'Dumbbell',  5)
ON CONFLICT (slug) DO NOTHING;

-- ─── module_subscriptions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_slug            TEXT        NOT NULL REFERENCES public.modules(slug),
  tier                   TEXT        NOT NULL DEFAULT 'free'
                           CHECK (tier IN ('free', 'basic', 'pro')),
  status                 TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'inactive', 'cancelled', 'trialing')),
  stripe_subscription_id TEXT,
  stripe_price_id        TEXT,
  current_period_end     TIMESTAMPTZ,
  ai_queries_this_month  INTEGER     NOT NULL DEFAULT 0,
  ai_queries_reset_date  TIMESTAMPTZ NOT NULL
                           DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_slug)
);

-- RLS
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modules visible to all authenticated users" ON public.modules
  FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE public.module_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscriptions" ON public.module_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
-- No INSERT/UPDATE from client — managed by Stripe webhook / admin

-- Auto-update updated_at
CREATE TRIGGER module_subscriptions_updated_at
  BEFORE UPDATE ON public.module_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── Auto-grant hunting:free on new member ───────────────────────────────────
-- When a new member row is created (triggered by auth signup), automatically
-- grant a free hunting subscription so all users have hunting access by default.

CREATE OR REPLACE FUNCTION public.handle_new_member_module_grant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
  VALUES (NEW.id, 'hunting', 'free', 'active')
  ON CONFLICT (user_id, module_slug) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_created_grant_hunting
  AFTER INSERT ON public.members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_member_module_grant();

-- ─── Backfill existing users ─────────────────────────────────────────────────
-- Grant hunting:free to all users who already exist in members table

INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
SELECT id, 'hunting', 'free', 'active'
FROM public.members
ON CONFLICT (user_id, module_slug) DO NOTHING;
