-- ─── Buddy System + Verified Members ─────────────────────────────────────────
-- Adds opt-in buddy matching, profile photos, verification status,
-- and optional social links to hunter_profiles.

-- New columns
ALTER TABLE public.hunter_profiles
  ADD COLUMN IF NOT EXISTS looking_for_buddy  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS willing_to_mentor  BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS buddy_bio          TEXT CHECK (char_length(buddy_bio) <= 500),
  ADD COLUMN IF NOT EXISTS avatar_url         TEXT,
  ADD COLUMN IF NOT EXISTS is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS social_facebook    TEXT,
  ADD COLUMN IF NOT EXISTS social_instagram   TEXT,
  ADD COLUMN IF NOT EXISTS social_x           TEXT;

-- Auto-compute verified status: photo + Hunter Ed = verified
CREATE OR REPLACE FUNCTION public.update_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_verified := (NEW.avatar_url IS NOT NULL AND NEW.hunter_ed_number IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_verified_status
  BEFORE INSERT OR UPDATE ON public.hunter_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_verified_status();

-- Partial index for buddy matching queries (only indexes opted-in users)
CREATE INDEX IF NOT EXISTS hunter_profiles_buddy_idx
  ON public.hunter_profiles (looking_for_buddy, willing_to_mentor)
  WHERE looking_for_buddy = TRUE OR willing_to_mentor = TRUE;

-- ─── Supabase Storage: avatars bucket ────────────────────────────────────────
-- NOTE: Create the 'avatars' storage bucket via Supabase Dashboard or CLI:
--   supabase storage create avatars --public
-- Storage RLS policies should allow:
--   - Authenticated users can upload to their own path: avatars/{user_id}.*
--   - Anyone authenticated can read all avatars (public profiles)
