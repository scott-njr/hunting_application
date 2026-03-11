-- Migration 0065: Add first_name, last_name to user_profile
ALTER TABLE public.user_profile
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;
