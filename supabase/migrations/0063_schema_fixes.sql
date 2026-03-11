-- 0063_schema_fixes.sql
-- Database design audit fixes: missing indexes, dead columns, constraint gaps

-- ============================================================
-- P1: Critical missing indexes
-- ============================================================

-- Every community feed query filters by module + orders by created_at
CREATE INDEX IF NOT EXISTS idx_social_posts_module
  ON social_posts(module, created_at DESC);

-- Every field map load queries all pins for a user
CREATE INDEX IF NOT EXISTS idx_hunting_field_map_pins_user
  ON hunting_field_map_pins(user_id, created_at DESC);

-- ============================================================
-- P1: Drop dead JSONB columns (zero codebase references)
-- ============================================================

ALTER TABLE hunting_plans DROP COLUMN IF EXISTS saved_services;
ALTER TABLE hunting_plans DROP COLUMN IF EXISTS ai_chat;

-- ============================================================
-- P2: Missing FK column indexes (Postgres doesn't auto-index FKs)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_hunting_locations_plan
  ON hunting_locations(hunt_plan_id);

CREATE INDEX IF NOT EXISTS idx_hunting_plans_user
  ON hunting_plans(user_id, status);

CREATE INDEX IF NOT EXISTS idx_hunting_gear_items_user
  ON hunting_gear_items(user_id);

CREATE INDEX IF NOT EXISTS idx_social_posts_user
  ON social_posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_progress_user
  ON course_progress(user_id, course_id);

CREATE INDEX IF NOT EXISTS idx_social_messages_recipient_unread
  ON social_messages(recipient_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- P2: Add CHECK constraints on free-text module/tier columns
-- ============================================================

ALTER TABLE social_posts
  ADD CONSTRAINT social_posts_module_check
  CHECK (module IN ('hunting', 'archery', 'firearms', 'medical', 'fishing', 'fitness'));

ALTER TABLE courses
  ADD CONSTRAINT courses_module_check
  CHECK (module IN ('hunting', 'archery', 'firearms', 'medical', 'fishing', 'fitness'));

ALTER TABLE courses
  ADD CONSTRAINT courses_tier_required_check
  CHECK (tier_required IN ('free', 'basic', 'pro'));

ALTER TABLE issue_reports
  ADD CONSTRAINT issue_reports_module_check
  CHECK (module IN ('hunting', 'archery', 'firearms', 'medical', 'fishing', 'fitness'));
