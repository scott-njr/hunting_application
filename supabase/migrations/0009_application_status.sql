-- Extend hunt_applications.status to include 'hunt_started'
-- Applied when user clicks "Plan Hunt" from Applications — becomes a read-only record

ALTER TABLE public.hunt_applications
  DROP CONSTRAINT IF EXISTS hunt_applications_status_check;

ALTER TABLE public.hunt_applications
  ADD CONSTRAINT hunt_applications_status_check
    CHECK (status IN ('applied', 'drawn', 'not_drawn', 'withdrawn', 'hunt_started'));
