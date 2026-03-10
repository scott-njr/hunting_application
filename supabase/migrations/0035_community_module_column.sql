-- Add module column to community_posts so each module has its own feed

ALTER TABLE public.community_posts
  ADD COLUMN module TEXT NOT NULL DEFAULT 'hunting';

-- Index for fast module-scoped queries
CREATE INDEX IF NOT EXISTS community_posts_module_idx
  ON public.community_posts (module, created_at DESC);
