-- 0067_audit_fixes_round2.sql
-- Database audit round 2: dead column cleanup + missing FK indexes

-- ============================================================
-- P1: Drop dead columns (zero codebase references)
-- ============================================================

ALTER TABLE hunting_plans DROP COLUMN IF EXISTS checklist;
ALTER TABLE hunting_plans DROP COLUMN IF EXISTS ai_recommendations;
ALTER TABLE hunting_plan_members DROP COLUMN IF EXISTS points_contributed;
ALTER TABLE user_profile DROP COLUMN IF EXISTS training_interests;
ALTER TABLE user_profile DROP COLUMN IF EXISTS nearest_airport;
ALTER TABLE user_profile DROP COLUMN IF EXISTS nearest_airport_name;

-- ============================================================
-- P1: Critical missing FK indexes
-- ============================================================

-- Every auth check queries module_subscriptions by user + module
CREATE INDEX IF NOT EXISTS idx_module_subscriptions_user_module
  ON module_subscriptions(user_id, module_slug);

-- Every friend list/request page queries both sides
CREATE INDEX IF NOT EXISTS idx_social_friendships_requester
  ON social_friendships(requester_id, status);

CREATE INDEX IF NOT EXISTS idx_social_friendships_recipient
  ON social_friendships(recipient_id, status);

-- Every hunt detail page loads members
CREATE INDEX IF NOT EXISTS idx_hunting_plan_members_plan
  ON hunting_plan_members(hunt_plan_id);

-- Every fitness plan page queries by user
CREATE INDEX IF NOT EXISTS idx_fitness_training_plans_user
  ON fitness_training_plans(user_id, plan_type, status);

-- ============================================================
-- P2: Secondary FK indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_hunting_points_user
  ON hunting_points(user_id, state);

CREATE INDEX IF NOT EXISTS idx_hunting_applications_user
  ON hunting_applications(user_id, year DESC);

CREATE INDEX IF NOT EXISTS idx_hunting_plan_members_user
  ON hunting_plan_members(user_id);

CREATE INDEX IF NOT EXISTS idx_social_comments_user
  ON social_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_social_reactions_user
  ON social_reactions(user_id);

CREATE INDEX IF NOT EXISTS idx_social_messages_sender
  ON social_messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hunting_draw_species_state
  ON hunting_draw_species(draw_state_id, species);
