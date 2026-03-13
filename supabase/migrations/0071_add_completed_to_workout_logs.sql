-- Add completed flag to workout logs so unchecking preserves notes
-- Default TRUE for backward compatibility with existing rows
ALTER TABLE public.fitness_plan_workout_logs
  ADD COLUMN completed BOOLEAN NOT NULL DEFAULT TRUE;
