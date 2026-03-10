-- ─── friendships ──────────────────────────────────────────────────────────────
-- Bidirectional friendship system — both parties must confirm before users
-- can add each other to hunt parties. Prevents arbitrary user lookups.

CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (requester_id, recipient_id),
  CHECK (requester_id != recipient_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" ON public.friendships
  FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send friend requests" ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Recipients can respond to requests" ON public.friendships
  FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "Either party can remove friendship" ON public.friendships
  FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ─── my_friends view ──────────────────────────────────────────────────────────
-- Convenience view — resolves friend display names and email from either
-- direction of the friendship, scoped to the calling user via security_invoker.

CREATE OR REPLACE VIEW public.my_friends AS
SELECT
  f.id AS friendship_id,
  CASE
    WHEN f.requester_id = auth.uid() THEN f.recipient_id
    ELSE f.requester_id
  END AS friend_id,
  hp.display_name,
  m.email,
  CASE
    WHEN f.requester_id = auth.uid() THEN 'sent'
    ELSE 'received'
  END AS direction,
  f.status,
  f.created_at
FROM public.friendships f
JOIN public.members m
  ON m.id = CASE
    WHEN f.requester_id = auth.uid() THEN f.recipient_id
    ELSE f.requester_id
  END
LEFT JOIN public.hunter_profiles hp
  ON hp.id = m.id
WHERE f.requester_id = auth.uid() OR f.recipient_id = auth.uid();

ALTER VIEW public.my_friends SET (security_invoker = true);

-- ─── RLS policy additions ─────────────────────────────────────────────────────
-- Open display_name reads on hunter_profiles so friend resolution works
-- (previously restricted to auth.uid() = id only).
-- Open basic member reads so user search works across the platform.

CREATE POLICY "Authenticated users can view display names"
  ON public.hunter_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view member basics"
  ON public.members FOR SELECT
  USING (auth.uid() IS NOT NULL);
