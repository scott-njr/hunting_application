-- Match system for USPSA-style competitions
-- An organizer creates a match, selects a Course of Fire, adds members, and runs each through sequentially

-- ─── Match table ──────────────────────────────────────────────────────────────

CREATE TABLE firearms_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_of_fire_id UUID NOT NULL REFERENCES firearms_course_of_fire(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  match_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('setup', 'active', 'complete')) DEFAULT 'setup',
  created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE firearms_match ENABLE ROW LEVEL SECURITY;

-- Organizer can do everything
CREATE POLICY "Organizer can manage own matches"
  ON firearms_match FOR ALL
  USING (organizer_id = auth.uid())
  WITH CHECK (organizer_id = auth.uid());

-- All authenticated users can view matches (for scoreboard viewing)
CREATE POLICY "Authenticated users can view matches"
  ON firearms_match FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Match member table ──────────────────────────────────────────────────────

CREATE TABLE firearms_match_member (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES firearms_match(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  squad TEXT,
  division TEXT CHECK (division IN ('open', 'limited', 'production', 'carry_optics', 'single_stack', 'revolver', 'pcc', 'limited_10')),
  power_factor TEXT CHECK (power_factor IN ('major', 'minor')) DEFAULT 'minor',
  classification TEXT CHECK (classification IN ('gm', 'm', 'a', 'b', 'c', 'd', 'u')),
  session_id UUID REFERENCES firearms_shot_session(id) ON DELETE SET NULL,
  shoot_order SMALLINT,
  created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);

ALTER TABLE firearms_match_member ENABLE ROW LEVEL SECURITY;

-- Organizer of the parent match can manage members
CREATE POLICY "Match organizer can manage members"
  ON firearms_match_member FOR ALL
  USING (EXISTS (
    SELECT 1 FROM firearms_match WHERE id = match_id AND organizer_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM firearms_match WHERE id = match_id AND organizer_id = auth.uid()
  ));

-- All authenticated users can view members (for scoreboard)
CREATE POLICY "Authenticated users can view match members"
  ON firearms_match_member FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Link sessions to matches ────────────────────────────────────────────────

ALTER TABLE firearms_shot_session
  ADD COLUMN match_id UUID REFERENCES firearms_match(id) ON DELETE SET NULL,
  ADD COLUMN match_member_id UUID REFERENCES firearms_match_member(id) ON DELETE SET NULL;

-- Index for match lookups
CREATE INDEX idx_firearms_match_organizer ON firearms_match(organizer_id);
CREATE INDEX idx_firearms_match_member_match ON firearms_match_member(match_id);
CREATE INDEX idx_firearms_shot_session_match ON firearms_shot_session(match_id) WHERE match_id IS NOT NULL;
