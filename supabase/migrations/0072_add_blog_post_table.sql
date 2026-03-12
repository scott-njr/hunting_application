-- ─── Blog post table ──────────────────────────────────────────────────────────
CREATE TABLE public.blog_post (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  content         TEXT NOT NULL DEFAULT '',
  excerpt         TEXT,
  cover_image_url TEXT,
  category        TEXT NOT NULL CHECK (category IN (
    'field_reports', 'gear_reviews', 'strategy_breakdowns',
    'scouting_intel', 'community_stories', 'how_to_guides'
  )),
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  author_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  published_on    TIMESTAMPTZ,
  created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_blog_post_status ON public.blog_post (status);
CREATE INDEX idx_blog_post_category ON public.blog_post (category);
CREATE INDEX idx_blog_post_published_on ON public.blog_post (published_on DESC);

-- Auto-update updated_on trigger (reuse existing function from migration 0070)
CREATE TRIGGER set_blog_post_updated_on
  BEFORE UPDATE ON public.blog_post
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

-- RLS
ALTER TABLE public.blog_post ENABLE ROW LEVEL SECURITY;

-- Public: read published posts only
CREATE POLICY "blog_post_public_read" ON public.blog_post
  FOR SELECT USING (status = 'published');

-- Admin writes go through service role API routes (bypasses RLS)
