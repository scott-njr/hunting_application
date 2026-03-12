-- ═══════════════════════════════════════════════════════════════════
-- Migration 0079: Drop unused columns + add missing FK indexes
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. Drop unused columns ────────────────────────────────────────
-- result_date: never referenced in application code (0 grep hits in src/)
ALTER TABLE public.hunting_applications DROP COLUMN IF EXISTS result_date;

-- species_requirements: never referenced in application code (0 grep hits in src/)
ALTER TABLE public.hunting_draw_species DROP COLUMN IF EXISTS species_requirements;

-- ─── 2. Add missing FK indexes (unindexed foreign keys) ────────────
-- social_comments.post_id — queried on every post detail load
CREATE INDEX IF NOT EXISTS idx_social_comments_post
  ON public.social_comments(post_id);

-- social_reactions.post_id — queried on every post to count likes
CREATE INDEX IF NOT EXISTS idx_social_reactions_post
  ON public.social_reactions(post_id);

-- blog_post.author_id — joined with user profiles on blog pages
CREATE INDEX IF NOT EXISTS idx_blog_post_author
  ON public.blog_post(author_id);
