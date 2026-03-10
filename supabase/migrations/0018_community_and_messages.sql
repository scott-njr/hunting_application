-- Community posts (unit reviews, hunt reports, guide reviews, general discussion)
-- and direct messages between friends

-- ─── community_posts ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type   TEXT NOT NULL DEFAULT 'discussion'
                CHECK (post_type IN ('discussion', 'unit_review', 'hunt_report', 'guide_review')),
  entity_name TEXT,           -- e.g. "E-E-049-O1-R", "Elk Country Outfitters", "Unit 85"
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read posts
CREATE POLICY "Authenticated users can read posts" ON public.community_posts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can manage their own posts
CREATE POLICY "Users manage own posts" ON public.community_posts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── direct_messages ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Users can only read messages they sent or received
CREATE POLICY "Users read own messages" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can insert messages they send
CREATE POLICY "Users send messages" ON public.direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read
CREATE POLICY "Recipients mark read" ON public.direct_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Index for fast conversation lookup
CREATE INDEX IF NOT EXISTS direct_messages_conversation_idx
  ON public.direct_messages (
    LEAST(sender_id::text, recipient_id::text),
    GREATEST(sender_id::text, recipient_id::text),
    created_at DESC
  );
