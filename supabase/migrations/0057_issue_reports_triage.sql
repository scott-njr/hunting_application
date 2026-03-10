-- AI triage columns on issue_reports
ALTER TABLE issue_reports
  ADD COLUMN severity text CHECK (severity IN ('easy', 'major')),
  ADD COLUMN ai_classified_at timestamptz,
  ADD COLUMN ai_proposed_fix text,
  ADD COLUMN github_issue_url text,
  ADD COLUMN admin_deploy_notes text;

CREATE INDEX idx_issue_reports_severity
  ON issue_reports(severity) WHERE severity IS NOT NULL;

-- Deploy history log
CREATE TABLE deploy_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  issue_id uuid REFERENCES issue_reports(id) ON DELETE SET NULL,
  severity text,
  status text NOT NULL DEFAULT 'triggered'
    CHECK (status IN ('triggered', 'building', 'success', 'failed')),
  github_pr_url text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE deploy_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage deploy_log"
  ON deploy_log FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND is_admin = true));
