-- Phase 1 additions
-- Extends hunter_profiles with identity fields + sat device
-- Adds hunt_type to hunt_plans
-- Creates hunt_members table

-- ─── hunter_profiles additions ────────────────────────────────────────────────

ALTER TABLE public.hunter_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS residency_state CHAR(2),
  ADD COLUMN IF NOT EXISTS hunter_ed_number TEXT,
  ADD COLUMN IF NOT EXISTS sat_device_type TEXT
    CHECK (sat_device_type IN ('inreach', 'spot', 'none')),
  ADD COLUMN IF NOT EXISTS sat_device_id TEXT;

-- ─── hunt_plans additions ─────────────────────────────────────────────────────

ALTER TABLE public.hunt_plans
  ADD COLUMN IF NOT EXISTS hunt_type TEXT
    CHECK (hunt_type IN ('group_draw', 'otc', 'out_of_state', 'in_state', 'solo'));

-- ─── hunt_members ─────────────────────────────────────────────────────────────
-- People in a hunt plan (Scout users or external invites)

CREATE TABLE IF NOT EXISTS public.hunt_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_plan_id UUID NOT NULL REFERENCES public.hunt_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  display_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  role TEXT NOT NULL DEFAULT 'collaborator'
    CHECK (role IN ('owner', 'collaborator', 'viewer')),

  tag_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (tag_status IN ('pending', 'applied', 'drawn', 'not_drawn')),

  points_contributed INT,
  is_scout_user BOOLEAN NOT NULL DEFAULT false,

  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.hunt_members ENABLE ROW LEVEL SECURITY;

-- Hunt plan owner can manage all members on their plans
CREATE POLICY "Hunt plan owner manages members" ON public.hunt_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.hunt_plans
      WHERE hunt_plans.id = hunt_members.hunt_plan_id
        AND hunt_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.hunt_plans
      WHERE hunt_plans.id = hunt_members.hunt_plan_id
        AND hunt_plans.user_id = auth.uid()
    )
  );
