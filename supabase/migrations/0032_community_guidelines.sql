-- ─── Community Guidelines Acknowledgement ────────────────────────────────────
-- Tracks when/which version of community guidelines each member accepted.
-- Version 0 = never accepted. Bump CURRENT_GUIDELINES_VERSION in code to
-- re-prompt all users after a guidelines update.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS community_guidelines_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS community_guidelines_version INTEGER NOT NULL DEFAULT 0;
