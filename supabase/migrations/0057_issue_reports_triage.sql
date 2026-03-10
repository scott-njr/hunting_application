-- AI triage columns on issue_reports
ALTER TABLE issue_reports
  ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('easy', 'major')),
  ADD COLUMN IF NOT EXISTS ai_classified_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_proposed_fix text,
  ADD COLUMN IF NOT EXISTS github_issue_url text,
  ADD COLUMN IF NOT EXISTS admin_deploy_notes text;

CREATE INDEX IF NOT EXISTS idx_issue_reports_severity
  ON issue_reports(severity) WHERE severity IS NOT NULL;

-- Deploy history log
CREATE TABLE IF NOT EXISTS deploy_log (
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'deploy_log' AND policyname = 'Admins can manage deploy_log'
  ) THEN
    CREATE POLICY "Admins can manage deploy_log"
      ON deploy_log FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM members WHERE id = auth.uid() AND is_admin = true));
  END IF;
END $$;
