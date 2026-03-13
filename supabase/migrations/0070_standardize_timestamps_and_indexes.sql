-- ═══════════════════════════════════════════════════════════════════
-- Migration 0070: Standardize timestamps to created_on/updated_on + add missing FK indexes
-- ═══════════════════════════════════════════════════════════════════
-- Convention: created_on = when a record is initially inserted
--             updated_on = when an update is made
-- Profile tables (user_profile, hunting_profile, fitness_profile) already use this convention.
-- This migration brings all remaining tables into alignment.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Add missing FK indexes (P2 from audit) ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_hunting_draw_species_draw_state
  ON public.hunting_draw_species(draw_state_id);

CREATE INDEX IF NOT EXISTS idx_course_progress_course
  ON public.course_progress(course_id);

-- ─── 2. Rename created_at → created_on on all tables ────────────────────────

ALTER TABLE public.ai_responses RENAME COLUMN created_at TO created_on;

ALTER TABLE public.members RENAME COLUMN created_at TO created_on;
ALTER TABLE public.members RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_points RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_points RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_applications RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_applications RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_plans RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_plans RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_plan_members RENAME COLUMN added_at TO created_on;
ALTER TABLE public.hunting_plan_members RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_locations RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_locations RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_gear_items RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_gear_items RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.deploy_log RENAME COLUMN created_at TO created_on;

ALTER TABLE public.hunting_draw_states RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_draw_states RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_draw_species RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_draw_species RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_draw_research_reports RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_draw_research_reports RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.social_friendships RENAME COLUMN created_at TO created_on;
ALTER TABLE public.social_friendships RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.social_posts RENAME COLUMN created_at TO created_on;
ALTER TABLE public.social_posts RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.social_messages RENAME COLUMN created_at TO created_on;

ALTER TABLE public.social_comments RENAME COLUMN created_at TO created_on;

ALTER TABLE public.social_reactions RENAME COLUMN created_at TO created_on;

ALTER TABLE public.issue_reports RENAME COLUMN created_at TO created_on;
ALTER TABLE public.issue_reports RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.hunting_field_map_pins RENAME COLUMN created_at TO created_on;
ALTER TABLE public.hunting_field_map_pins RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.courses RENAME COLUMN created_at TO created_on;
ALTER TABLE public.courses RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.course_progress RENAME COLUMN created_at TO created_on;
ALTER TABLE public.course_progress RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.module_subscriptions RENAME COLUMN created_at TO created_on;
ALTER TABLE public.module_subscriptions RENAME COLUMN updated_at TO updated_on;

ALTER TABLE public.fitness_weekly_workouts RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_workout_submissions RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_baseline_tests RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_leaderboard_points RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_shared_items RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_challenges RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_challenge_submissions RENAME COLUMN submitted_at TO created_on;

ALTER TABLE public.fitness_shared_plans RENAME COLUMN shared_at TO created_on;

ALTER TABLE public.fitness_training_plans RENAME COLUMN created_at TO created_on;

ALTER TABLE public.fitness_plan_workout_logs RENAME COLUMN created_at TO created_on;

-- ─── 3. Repoint auto-update triggers from handle_updated_at → handle_updated_on ─

-- members
DROP TRIGGER IF EXISTS members_updated_at ON public.members;
CREATE TRIGGER members_updated_on
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_applications
DROP TRIGGER IF EXISTS hunt_applications_updated_at ON public.hunting_applications;
CREATE TRIGGER hunting_applications_updated_on
  BEFORE UPDATE ON public.hunting_applications
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_plans
DROP TRIGGER IF EXISTS hunt_plans_updated_at ON public.hunting_plans;
CREATE TRIGGER hunting_plans_updated_on
  BEFORE UPDATE ON public.hunting_plans
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_plan_members
DROP TRIGGER IF EXISTS hunt_members_updated_at ON public.hunting_plan_members;
CREATE TRIGGER hunting_plan_members_updated_on
  BEFORE UPDATE ON public.hunting_plan_members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_locations
DROP TRIGGER IF EXISTS hunt_locations_updated_at ON public.hunting_locations;
CREATE TRIGGER hunting_locations_updated_on
  BEFORE UPDATE ON public.hunting_locations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_gear_items
DROP TRIGGER IF EXISTS gear_items_updated_at ON public.hunting_gear_items;
CREATE TRIGGER hunting_gear_items_updated_on
  BEFORE UPDATE ON public.hunting_gear_items
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- hunting_field_map_pins
DROP TRIGGER IF EXISTS journal_pins_updated_at ON public.hunting_field_map_pins;
CREATE TRIGGER hunting_field_map_pins_updated_on
  BEFORE UPDATE ON public.hunting_field_map_pins
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- social_friendships
DROP TRIGGER IF EXISTS friendships_updated_at ON public.social_friendships;
CREATE TRIGGER social_friendships_updated_on
  BEFORE UPDATE ON public.social_friendships
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- social_posts
DROP TRIGGER IF EXISTS community_posts_updated_at ON public.social_posts;
CREATE TRIGGER social_posts_updated_on
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- issue_reports
DROP TRIGGER IF EXISTS issue_reports_updated_at ON public.issue_reports;
CREATE TRIGGER issue_reports_updated_on
  BEFORE UPDATE ON public.issue_reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- courses
DROP TRIGGER IF EXISTS courses_updated_at ON public.courses;
CREATE TRIGGER courses_updated_on
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- course_progress
DROP TRIGGER IF EXISTS course_progress_updated_at ON public.course_progress;
CREATE TRIGGER course_progress_updated_on
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- module_subscriptions
DROP TRIGGER IF EXISTS module_subscriptions_updated_at ON public.module_subscriptions;
CREATE TRIGGER module_subscriptions_updated_on
  BEFORE UPDATE ON public.module_subscriptions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- ─── 4. Recreate my_friends view with renamed column ─────────────────────────

DROP VIEW IF EXISTS public.my_friends;
CREATE OR REPLACE VIEW public.my_friends AS
SELECT
  f.id AS friendship_id,
  CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END AS friend_id,
  up.display_name,
  m.email,
  CASE WHEN f.requester_id = auth.uid() THEN 'sent' ELSE 'received' END AS direction,
  f.status,
  f.created_on
FROM public.social_friendships f
JOIN public.members m ON m.id = CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END
LEFT JOIN public.user_profile up ON up.id = m.id
WHERE f.requester_id = auth.uid() OR f.recipient_id = auth.uid();

ALTER VIEW public.my_friends SET (security_invoker = true);
