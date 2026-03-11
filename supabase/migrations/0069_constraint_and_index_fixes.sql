-- Fix hunting_applications.status CHECK constraint to include 'hunt_started'
ALTER TABLE hunting_applications DROP CONSTRAINT IF EXISTS hunt_applications_status_check;
ALTER TABLE hunting_applications DROP CONSTRAINT IF EXISTS hunting_applications_status_check;
ALTER TABLE hunting_applications ADD CONSTRAINT hunting_applications_status_check
  CHECK (status IN ('applied', 'drawn', 'not_drawn', 'withdrawn', 'hunt_started'));

-- Add missing index on hunting_draw_research_reports.user_id
CREATE INDEX IF NOT EXISTS idx_hunting_draw_research_user
  ON hunting_draw_research_reports(user_id);

-- Add missing index on ai_responses for admin AI usage page queries
CREATE INDEX IF NOT EXISTS idx_ai_responses_user_created
  ON ai_responses(user_id, created_at DESC);

-- Add missing index on courses for module + published queries
CREATE INDEX IF NOT EXISTS idx_courses_module_published
  ON courses(module, published) WHERE published = true;

-- Add missing index on hunting_draw_states for deadlines page lookups
CREATE INDEX IF NOT EXISTS idx_hunting_draw_states_code_year
  ON hunting_draw_states(state_code, year);
