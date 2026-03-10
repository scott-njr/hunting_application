-- Add fitness body composition and strength benchmark fields to hunter_profiles
ALTER TABLE hunter_profiles
  ADD COLUMN IF NOT EXISTS height_inches smallint,
  ADD COLUMN IF NOT EXISTS weight_lbs smallint,
  ADD COLUMN IF NOT EXISTS bench_press_lbs smallint,
  ADD COLUMN IF NOT EXISTS squat_lbs smallint,
  ADD COLUMN IF NOT EXISTS deadlift_lbs smallint,
  ADD COLUMN IF NOT EXISTS overhead_press_lbs smallint;
