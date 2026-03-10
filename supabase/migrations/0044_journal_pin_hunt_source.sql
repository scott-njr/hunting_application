-- Add source_hunt_plan_id to journal_pins so we can track pins created from scout reports
ALTER TABLE public.journal_pins
  ADD COLUMN source_hunt_plan_id UUID REFERENCES public.hunt_plans(id) ON DELETE SET NULL;

-- Index for efficient lookup when deleting a hunt and its associated pins
CREATE INDEX idx_journal_pins_source_hunt ON public.journal_pins (source_hunt_plan_id)
  WHERE source_hunt_plan_id IS NOT NULL;
