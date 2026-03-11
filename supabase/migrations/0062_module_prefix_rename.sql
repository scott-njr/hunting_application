-- Module-prefix rename: hunting_, fitness_, social_
-- Aligns table naming with module ownership for long-term clarity.

-- ============================================================
-- HUNTING TABLES
-- ============================================================

ALTER TABLE public.hunt_plans RENAME TO hunting_plans;
ALTER TABLE public.hunt_locations RENAME TO hunting_locations;
ALTER TABLE public.hunt_members RENAME TO hunting_plan_members;
ALTER TABLE public.hunt_applications RENAME TO hunting_applications;
ALTER TABLE public.hunter_points RENAME TO hunting_points;
ALTER TABLE public.journal_pins RENAME TO hunting_field_map_pins;
ALTER TABLE public.gear_items RENAME TO hunting_gear_items;
ALTER TABLE public.gear_checklist RENAME TO hunting_gear_checklist;
ALTER TABLE public.draw_states RENAME TO hunting_draw_states;
ALTER TABLE public.draw_species RENAME TO hunting_draw_species;
ALTER TABLE public.draw_research_reports RENAME TO hunting_draw_research_reports;

-- Drop orphaned table (zero code references)
DROP TABLE IF EXISTS public.journal_sightings;

-- Hunting triggers
ALTER TRIGGER hunt_plans_updated_at ON public.hunting_plans RENAME TO hunting_plans_updated_at;
ALTER TRIGGER hunt_applications_updated_at ON public.hunting_applications RENAME TO hunting_applications_updated_at;
ALTER TRIGGER hunt_members_updated_at ON public.hunting_plan_members RENAME TO hunting_plan_members_updated_at;
ALTER TRIGGER journal_pins_updated_at ON public.hunting_field_map_pins RENAME TO hunting_field_map_pins_updated_at;
ALTER TRIGGER gear_items_updated_at ON public.hunting_gear_items RENAME TO hunting_gear_items_updated_at;

-- Hunting indexes
ALTER INDEX idx_journal_pins_source_hunt RENAME TO idx_hunting_field_map_pins_source_hunt;

-- ============================================================
-- FITNESS TABLES
-- ============================================================

ALTER TABLE public.weekly_workouts RENAME TO fitness_weekly_workouts;
ALTER TABLE public.workout_submissions RENAME TO fitness_workout_submissions;
ALTER TABLE public.baseline_tests RENAME TO fitness_baseline_tests;
ALTER TABLE public.training_plans RENAME TO fitness_training_plans;
ALTER TABLE public.plan_workout_logs RENAME TO fitness_plan_workout_logs;
ALTER TABLE public.shared_plans RENAME TO fitness_shared_plans;
ALTER TABLE public.leaderboard_points RENAME TO fitness_leaderboard_points;

-- Fitness triggers (baseline_tests, weekly_workouts, leaderboard_points have no update triggers)

-- Fitness indexes
ALTER INDEX idx_workout_submissions_workout RENAME TO idx_fitness_workout_submissions_workout;
ALTER INDEX idx_workout_submissions_user RENAME TO idx_fitness_workout_submissions_user;
ALTER INDEX idx_baseline_tests_user_date RENAME TO idx_fitness_baseline_tests_user_date;
ALTER INDEX idx_training_plans_active RENAME TO idx_fitness_training_plans_active;
ALTER INDEX idx_training_plans_user RENAME TO idx_fitness_training_plans_user;
ALTER INDEX idx_plan_workout_logs_plan RENAME TO idx_fitness_plan_workout_logs_plan;
ALTER INDEX idx_plan_workout_logs_user RENAME TO idx_fitness_plan_workout_logs_user;
ALTER INDEX idx_shared_plans_source RENAME TO idx_fitness_shared_plans_source;
ALTER INDEX idx_shared_plans_target RENAME TO idx_fitness_shared_plans_target;
ALTER INDEX idx_shared_plans_source_plan RENAME TO idx_fitness_shared_plans_source_plan;
ALTER INDEX idx_shared_plans_target_plan RENAME TO idx_fitness_shared_plans_target_plan;
ALTER INDEX idx_leaderboard_points_user RENAME TO idx_fitness_leaderboard_points_user;
ALTER INDEX idx_leaderboard_points_week RENAME TO idx_fitness_leaderboard_points_week;
ALTER INDEX idx_leaderboard_points_workout RENAME TO idx_fitness_leaderboard_points_workout;

-- ============================================================
-- SOCIAL TABLES
-- ============================================================

ALTER TABLE public.community_posts RENAME TO social_posts;
ALTER TABLE public.post_comments RENAME TO social_comments;
ALTER TABLE public.post_reactions RENAME TO social_reactions;
ALTER TABLE public.friendships RENAME TO social_friendships;
ALTER TABLE public.direct_messages RENAME TO social_messages;

-- Social triggers
ALTER TRIGGER community_posts_updated_at ON public.social_posts RENAME TO social_posts_updated_at;
ALTER TRIGGER friendships_updated_at ON public.social_friendships RENAME TO social_friendships_updated_at;

-- Social indexes
ALTER INDEX community_posts_module_idx RENAME TO social_posts_module_idx;
ALTER INDEX post_comments_post_id_idx RENAME TO social_comments_post_id_idx;
ALTER INDEX post_reactions_post_id_idx RENAME TO social_reactions_post_id_idx;
ALTER INDEX direct_messages_conversation_idx RENAME TO social_messages_conversation_idx;

-- Recreate my_friends view with renamed table
DROP VIEW IF EXISTS public.my_friends;
CREATE OR REPLACE VIEW public.my_friends AS
SELECT
  f.id AS friendship_id,
  CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END AS friend_id,
  up.display_name,
  m.email,
  CASE WHEN f.requester_id = auth.uid() THEN 'sent' ELSE 'received' END AS direction,
  f.status,
  f.created_at
FROM public.social_friendships f
JOIN public.members m ON m.id = CASE WHEN f.requester_id = auth.uid() THEN f.recipient_id ELSE f.requester_id END
LEFT JOIN public.user_profile up ON up.id = m.id
WHERE f.requester_id = auth.uid() OR f.recipient_id = auth.uid();

ALTER VIEW public.my_friends SET (security_invoker = true);
