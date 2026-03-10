-- Add onboarding fields to members table
ALTER TABLE members
  ADD COLUMN experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  ADD COLUMN interests text[] DEFAULT '{}',
  ADD COLUMN fitness_level text CHECK (fitness_level IN ('just_starting', 'moderately_active', 'very_active', 'competitive')),
  ADD COLUMN residential_state text,
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Index for quick lookup in middleware/redirects
CREATE INDEX idx_members_onboarding ON members (id) WHERE NOT onboarding_completed;
