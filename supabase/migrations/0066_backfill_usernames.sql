-- Backfill random usernames for all user_profile rows that don't have one.
-- Format: "user_" + 8 random lowercase alphanumeric characters.
-- Users can change their username later in profile settings.

UPDATE public.user_profile
SET user_name = 'user_' || substr(md5(random()::text || id::text), 1, 8)
WHERE user_name IS NULL;

-- Make user_name NOT NULL now that all rows have values
ALTER TABLE public.user_profile
  ALTER COLUMN user_name SET NOT NULL;
