-- ═══════════════════════════════════════════════════════════════════
-- Migration 0074: Fix blog_post author constraint + add missing updated_on
-- 1. blog_post.author_id: NOT NULL conflicts with ON DELETE SET NULL — make nullable
-- 2. fitness_training_plans: add missing updated_on column + trigger
-- 3. email_broadcast: add updated_on column + trigger
-- 4. fitness_shared_plans: add updated_on column + trigger
-- 5. fitness_plan_workout_logs: add updated_on column + trigger
-- ═══════════════════════════════════════════════════════════════════

-- 1. Fix blog_post.author_id — allow NULL so ON DELETE SET NULL works
ALTER TABLE public.blog_post ALTER COLUMN author_id DROP NOT NULL;

-- 2. fitness_training_plans — add updated_on
ALTER TABLE public.fitness_training_plans ADD COLUMN IF NOT EXISTS updated_on TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER set_fitness_training_plans_updated_on
  BEFORE UPDATE ON public.fitness_training_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- 3. email_broadcast — add updated_on
ALTER TABLE public.email_broadcast ADD COLUMN IF NOT EXISTS updated_on TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER set_email_broadcast_updated_on
  BEFORE UPDATE ON public.email_broadcast
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- 4. fitness_shared_plans — add updated_on
ALTER TABLE public.fitness_shared_plans ADD COLUMN IF NOT EXISTS updated_on TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER set_fitness_shared_plans_updated_on
  BEFORE UPDATE ON public.fitness_shared_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- 5. fitness_plan_workout_logs — add updated_on
ALTER TABLE public.fitness_plan_workout_logs ADD COLUMN IF NOT EXISTS updated_on TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TRIGGER set_fitness_plan_workout_logs_updated_on
  BEFORE UPDATE ON public.fitness_plan_workout_logs
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();
