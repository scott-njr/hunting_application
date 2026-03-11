-- Migration 0064: Clean up orphaned columns on members table
-- These columns were written during onboarding but never read after migration 0061
-- split profiles into user_profile / hunting_profile / fitness_profile.

-- 1. Add fitness_level to fitness_profile (was only on members)
ALTER TABLE public.fitness_profile
  ADD COLUMN IF NOT EXISTS fitness_level TEXT
  CHECK (fitness_level IN ('just_starting', 'moderately_active', 'very_active', 'competitive'));

-- 2. Migrate existing data before dropping columns

-- FIRST: Create user_profile rows for any members that don't have one yet
-- (must run before fitness_profile/hunting_profile inserts due to FK constraints)
INSERT INTO public.user_profile (id, display_name)
SELECT m.id, m.full_name FROM public.members m
WHERE NOT EXISTS (SELECT 1 FROM public.user_profile up WHERE up.id = m.id)
ON CONFLICT (id) DO NOTHING;

-- Copy fitness_level → fitness_profile
INSERT INTO public.fitness_profile (id, fitness_level)
SELECT id, fitness_level FROM public.members WHERE fitness_level IS NOT NULL
ON CONFLICT (id) DO UPDATE SET fitness_level = COALESCE(public.fitness_profile.fitness_level, EXCLUDED.fitness_level);

-- Copy experience_level → hunting_profile (only where hunting_profile has null)
INSERT INTO public.hunting_profile (id, experience_level)
SELECT id, experience_level::text FROM public.members WHERE experience_level IS NOT NULL
ON CONFLICT (id) DO UPDATE SET experience_level = COALESCE(public.hunting_profile.experience_level, EXCLUDED.experience_level);

-- Copy residential_state → user_profile.state (only where state is null)
UPDATE public.user_profile up
SET state = m.residential_state
FROM public.members m
WHERE up.id = m.id AND up.state IS NULL AND m.residential_state IS NOT NULL;

-- Copy full_name → user_profile.display_name (only where display_name is null)
UPDATE public.user_profile up
SET display_name = m.full_name
FROM public.members m
WHERE up.id = m.id AND up.display_name IS NULL AND m.full_name IS NOT NULL;

-- 3. Update handle_new_user() trigger to also create user_profile row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  -- Also create user_profile with display_name so it's always available
  INSERT INTO public.user_profile (id, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop orphaned columns from members (keep full_name for now — two-phase drop)
ALTER TABLE public.members
  DROP COLUMN IF EXISTS experience_level,
  DROP COLUMN IF EXISTS interests,
  DROP COLUMN IF EXISTS fitness_level,
  DROP COLUMN IF EXISTS residential_state;
