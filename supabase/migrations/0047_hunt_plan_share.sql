-- Add emergency contact and print recipients for hunt plan sharing
ALTER TABLE hunt_plans
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS print_recipients JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN hunt_plans.emergency_contact_name IS 'Emergency contact for this hunt trip';
COMMENT ON COLUMN hunt_plans.emergency_contact_phone IS 'Emergency contact phone number';
COMMENT ON COLUMN hunt_plans.print_recipients IS 'Array of {email} objects for non-Scout share recipients';
