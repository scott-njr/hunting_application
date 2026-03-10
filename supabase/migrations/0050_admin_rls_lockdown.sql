-- Lock down is_admin so users cannot self-promote via client-side Supabase calls.
-- membership_tier and membership_status columns were removed in 0043_remove_legacy_member_columns.sql.

DROP POLICY IF EXISTS "Users can update own profile" ON public.members;
CREATE POLICY "Users can update own profile"
  ON public.members FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM public.members WHERE id = auth.uid())
  );
