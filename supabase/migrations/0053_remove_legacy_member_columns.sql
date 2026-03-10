-- Migration: Remove legacy tier/status/quota columns from members table
-- These are now tracked per-module in module_subscriptions.
-- stripe_customer_id is kept (user-level data).

-- Drop the RLS policy that references membership_tier / membership_status
DROP POLICY IF EXISTS "Users can update own profile" ON public.members;

-- Re-create update policy without tier/status guards
CREATE POLICY "Users can update own profile"
  ON public.members FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop the redundant columns
ALTER TABLE public.members DROP COLUMN IF EXISTS membership_tier;
ALTER TABLE public.members DROP COLUMN IF EXISTS membership_status;
ALTER TABLE public.members DROP COLUMN IF EXISTS ai_queries_this_month;
ALTER TABLE public.members DROP COLUMN IF EXISTS ai_queries_reset_date;
