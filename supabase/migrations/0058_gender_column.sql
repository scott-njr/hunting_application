-- Add gender column to hunter_profiles
ALTER TABLE public.hunter_profiles
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT NULL
  CHECK (gender IN ('male', 'female'));
