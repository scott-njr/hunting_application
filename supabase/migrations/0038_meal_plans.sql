-- Add 'meal' to training_plans plan_type check constraint
ALTER TABLE training_plans DROP CONSTRAINT training_plans_plan_type_check;
ALTER TABLE training_plans ADD CONSTRAINT training_plans_plan_type_check
  CHECK (plan_type IN ('run', 'strength', 'meal'));
