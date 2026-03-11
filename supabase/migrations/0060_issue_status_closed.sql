-- Add 'closed' to issue_reports status check constraint
ALTER TABLE issue_reports DROP CONSTRAINT IF EXISTS issue_reports_status_check;
ALTER TABLE issue_reports ADD CONSTRAINT issue_reports_status_check
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'wont_fix'));
