-- Add contact fields and photo gallery to hunter_profiles
ALTER TABLE public.hunter_profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS backup_email TEXT,
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] NOT NULL DEFAULT '{}';
