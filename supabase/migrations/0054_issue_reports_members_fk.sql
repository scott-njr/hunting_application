-- Add FK from issue_reports.user_id to members.id for PostgREST join support
-- (The existing FK to auth.users handles cascade deletes; this one enables the admin API join)
ALTER TABLE issue_reports
  ADD CONSTRAINT issue_reports_user_id_members_fkey
  FOREIGN KEY (user_id) REFERENCES members(id) ON DELETE CASCADE;
