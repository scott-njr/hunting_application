-- Issue reporting system: users report bugs/issues, admins resolve and notify

-- Add admin flag to members
ALTER TABLE members ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Issue reports table
CREATE TABLE issue_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module      text NOT NULL DEFAULT 'hunting',
  category    text NOT NULL DEFAULT 'bug'
    CHECK (category IN ('bug', 'feature_request', 'content_error', 'other')),
  title       text NOT NULL,
  description text NOT NULL,
  page_url    text,
  status      text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'wont_fix')),
  admin_notes text,
  resolution  text,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  release_tag text,
  notified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issue_reports ENABLE ROW LEVEL SECURITY;

-- Users read own reports
CREATE POLICY "Users can view own reports" ON issue_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Users create own reports
CREATE POLICY "Users can create reports" ON issue_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can view resolved issues with a release tag (for public changelog)
CREATE POLICY "Anyone can view resolved issues" ON issue_reports
  FOR SELECT USING (status = 'resolved' AND release_tag IS NOT NULL);

-- Admins full access
CREATE POLICY "Admins full access" ON issue_reports
  FOR ALL USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND is_admin = true));

-- Indexes
CREATE INDEX idx_issue_reports_user ON issue_reports(user_id, created_at DESC);
CREATE INDEX idx_issue_reports_module_status ON issue_reports(module, status);
CREATE INDEX idx_issue_reports_release ON issue_reports(release_tag) WHERE release_tag IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER issue_reports_updated_at
  BEFORE UPDATE ON issue_reports
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
