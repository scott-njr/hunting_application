-- Comments and reactions on community posts
-- post_comments: threaded replies on posts (max 1000 chars)
-- post_reactions: simple thumbs-up per post per user (toggle)

-- ─── post_comments ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_comments_post_id_idx ON public.post_comments (post_id, created_at);

-- ─── post_reactions ─────────────────────────────────────────────────────────
-- One row per (post, user) — single like/helpful toggle, no multi-type for MVP

CREATE TABLE IF NOT EXISTS public.post_reactions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
  ON public.post_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can react"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS post_reactions_post_id_idx ON public.post_reactions (post_id);
