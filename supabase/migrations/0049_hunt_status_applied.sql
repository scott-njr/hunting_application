-- Add 'applied' status to hunt_plans for draw application tracking
-- Flow: planning → applied → booked → completed (or cancelled at any point)

ALTER TABLE hunt_plans DROP CONSTRAINT IF EXISTS hunt_plans_status_check;
ALTER TABLE hunt_plans ADD CONSTRAINT hunt_plans_status_check
  CHECK (status IN ('planning', 'applied', 'booked', 'completed', 'cancelled'));
