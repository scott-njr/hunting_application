-- Add targets column to blog_post for multi-destination publishing
-- Values: 'public' (public blog page), or module slugs ('hunting', 'archery', etc.)
ALTER TABLE public.blog_post
  ADD COLUMN IF NOT EXISTS targets TEXT[] NOT NULL DEFAULT '{public}';

-- Backfill existing posts to target public blog
UPDATE public.blog_post SET targets = '{public}' WHERE targets IS NULL;

-- GIN index for array contains queries (e.g., targets @> '{hunting}')
CREATE INDEX IF NOT EXISTS idx_blog_post_targets ON public.blog_post USING GIN (targets);
