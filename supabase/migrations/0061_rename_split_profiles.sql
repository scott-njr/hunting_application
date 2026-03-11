-- ═══════════════════════════════════════════════════════════════════
-- Migration 0061: Rename & split hunter_profiles into
--   user_profile + hunting_profile + fitness_profile
-- ═══════════════════════════════════════════════════════════════════

-- New trigger function for tables using updated_on column name
CREATE OR REPLACE FUNCTION public.handle_updated_on()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_on = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- 1. Rename hunter_profiles → user_profile
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.hunter_profiles RENAME TO user_profile;

ALTER INDEX idx_hunter_profiles_user_name_unique RENAME TO idx_user_profile_user_name_unique;
ALTER INDEX hunter_profiles_buddy_idx RENAME TO user_profile_buddy_idx;

ALTER TABLE public.user_profile RENAME CONSTRAINT hunter_profiles_user_name_format TO user_profile_user_name_format;

-- Drop old trigger, create new one pointing to handle_updated_on
DROP TRIGGER IF EXISTS handle_hunter_profiles_updated_at ON public.user_profile;
CREATE TRIGGER handle_user_profile_updated_on
  BEFORE UPDATE ON public.user_profile
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- ═══════════════════════════════════════════════════════════════════
-- 2. Rename columns on user_profile
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.user_profile RENAME COLUMN backup_email TO email;
ALTER TABLE public.user_profile RENAME COLUMN home_city TO city;
ALTER TABLE public.user_profile RENAME COLUMN residency_state TO state;
ALTER TABLE public.user_profile RENAME COLUMN created_at TO created_on;
ALTER TABLE public.user_profile RENAME COLUMN updated_at TO updated_on;
ALTER TABLE public.user_profile DROP COLUMN IF EXISTS profile_completed_at;
ALTER TABLE public.user_profile DROP COLUMN IF EXISTS home_state;
ALTER TABLE public.user_profile ADD COLUMN IF NOT EXISTS country TEXT;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Create hunting_profile (copy data from user_profile)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.hunting_profile (
  id UUID PRIMARY KEY REFERENCES public.user_profile(id) ON DELETE CASCADE,
  weapon_types TEXT[] NOT NULL DEFAULT '{}',
  target_species TEXT[] NOT NULL DEFAULT '{}',
  states_of_interest TEXT[] NOT NULL DEFAULT '{}',
  hunt_access_types TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','experienced','expert')),
  years_hunting INT,
  annual_budget TEXT CHECK (annual_budget IN ('under_500','500_2000','2000_5000','5000_15000','15000_plus')),
  hunt_styles TEXT[] NOT NULL DEFAULT '{}',
  hunter_ed_number TEXT,
  sat_device_type TEXT CHECK (sat_device_type IN ('inreach','spot','none')),
  sat_device_id TEXT,
  willing_to_fly BOOLEAN,
  max_drive_hours INT,
  looking_for_buddy BOOLEAN NOT NULL DEFAULT FALSE,
  willing_to_mentor BOOLEAN NOT NULL DEFAULT FALSE,
  buddy_bio TEXT CHECK (char_length(buddy_bio) <= 500),
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.hunting_profile (
  id, weapon_types, target_species, states_of_interest, hunt_access_types,
  experience_level, years_hunting, annual_budget, hunt_styles,
  hunter_ed_number, sat_device_type, sat_device_id, willing_to_fly,
  max_drive_hours, looking_for_buddy, willing_to_mentor, buddy_bio,
  created_on, updated_on
)
SELECT
  id, weapon_types, target_species, states_of_interest, hunt_access_types,
  experience_level, years_hunting, annual_budget, hunt_styles,
  hunter_ed_number, sat_device_type, sat_device_id, willing_to_fly,
  max_drive_hours, looking_for_buddy, willing_to_mentor, buddy_bio,
  created_on, updated_on
FROM public.user_profile;

ALTER TABLE public.hunting_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hunting profile" ON public.hunting_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own hunting profile" ON public.hunting_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own hunting profile" ON public.hunting_profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated view hunting profiles" ON public.hunting_profile FOR SELECT TO authenticated USING (true);

CREATE TRIGGER handle_hunting_profile_updated_on
  BEFORE UPDATE ON public.hunting_profile
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- ═══════════════════════════════════════════════════════════════════
-- 4. Create fitness_profile (copy data from user_profile)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE public.fitness_profile (
  id UUID PRIMARY KEY REFERENCES public.user_profile(id) ON DELETE CASCADE,
  height_inches SMALLINT,
  weight_lbs SMALLINT,
  bench_press_lbs SMALLINT,
  squat_lbs SMALLINT,
  deadlift_lbs SMALLINT,
  overhead_press_lbs SMALLINT,
  created_on TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_on TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.fitness_profile (id, height_inches, weight_lbs, bench_press_lbs, squat_lbs, deadlift_lbs, overhead_press_lbs, created_on, updated_on)
SELECT id, height_inches, weight_lbs, bench_press_lbs, squat_lbs, deadlift_lbs, overhead_press_lbs, created_on, updated_on
FROM public.user_profile
WHERE height_inches IS NOT NULL OR weight_lbs IS NOT NULL;

ALTER TABLE public.fitness_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own fitness profile" ON public.fitness_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own fitness profile" ON public.fitness_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own fitness profile" ON public.fitness_profile FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Authenticated view fitness profiles" ON public.fitness_profile FOR SELECT TO authenticated USING (true);

CREATE TRIGGER handle_fitness_profile_updated_on
  BEFORE UPDATE ON public.fitness_profile
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- ═══════════════════════════════════════════════════════════════════
-- 5. Drop moved/obsolete columns from user_profile
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.user_profile
  DROP COLUMN IF EXISTS weapon_types,
  DROP COLUMN IF EXISTS target_species,
  DROP COLUMN IF EXISTS states_of_interest,
  DROP COLUMN IF EXISTS hunt_access_types,
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS years_hunting,
  DROP COLUMN IF EXISTS annual_budget,
  DROP COLUMN IF EXISTS hunt_styles,
  DROP COLUMN IF EXISTS hunter_ed_number,
  DROP COLUMN IF EXISTS sat_device_type,
  DROP COLUMN IF EXISTS sat_device_id,
  DROP COLUMN IF EXISTS willing_to_fly,
  DROP COLUMN IF EXISTS max_drive_hours,
  DROP COLUMN IF EXISTS typical_trip_days,
  DROP COLUMN IF EXISTS max_trips_per_year,
  DROP COLUMN IF EXISTS looking_for_buddy,
  DROP COLUMN IF EXISTS willing_to_mentor,
  DROP COLUMN IF EXISTS buddy_bio,
  DROP COLUMN IF EXISTS height_inches,
  DROP COLUMN IF EXISTS weight_lbs,
  DROP COLUMN IF EXISTS bench_press_lbs,
  DROP COLUMN IF EXISTS squat_lbs,
  DROP COLUMN IF EXISTS deadlift_lbs,
  DROP COLUMN IF EXISTS overhead_press_lbs;

-- Drop buddy index (columns moved to hunting_profile)
DROP INDEX IF EXISTS user_profile_buddy_idx;

-- Create buddy index on hunting_profile
CREATE INDEX IF NOT EXISTS hunting_profile_buddy_idx
  ON public.hunting_profile (looking_for_buddy, willing_to_mentor)
  WHERE looking_for_buddy = TRUE OR willing_to_mentor = TRUE;

-- Update verified trigger: hunter_ed_number moved to hunting_profile, just check avatar
CREATE OR REPLACE FUNCTION public.update_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_verified := (NEW.avatar_url IS NOT NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- 6. Recreate my_friends view (references old table name)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW public.my_friends AS
SELECT
  f.id AS friendship_id,
  CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END AS friend_id,
  up.display_name,
  m.email,
  CASE WHEN f.requester_id = auth.uid() THEN 'sent' ELSE 'received' END AS direction,
  f.status,
  f.created_at
FROM public.friendships f
JOIN public.members m ON m.id = CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END
LEFT JOIN public.user_profile up ON up.id = m.id
WHERE f.requester_id = auth.uid() OR f.recipient_id = auth.uid();
