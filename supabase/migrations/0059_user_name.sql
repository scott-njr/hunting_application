-- Add unique user_name handle to hunter_profiles
-- Nullable initially so existing users aren't broken — they'll set it on next profile visit
ALTER TABLE public.hunter_profiles
  ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT NULL;

-- Lowercase alphanumeric + underscores, 3-20 chars
ALTER TABLE public.hunter_profiles
  ADD CONSTRAINT hunter_profiles_user_name_format
  CHECK (user_name ~ '^[a-z0-9_]{3,20}$');

-- Case-insensitive unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_hunter_profiles_user_name_unique
  ON public.hunter_profiles (lower(user_name))
  WHERE user_name IS NOT NULL;
