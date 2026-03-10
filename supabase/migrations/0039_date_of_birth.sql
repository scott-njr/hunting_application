-- Add date_of_birth to hunter_profiles
alter table public.hunter_profiles
  add column if not exists date_of_birth date;
