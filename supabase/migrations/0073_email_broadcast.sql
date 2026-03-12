-- ═══════════════════════════════════════════════════════════════════
-- Migration 0073: Email broadcast system
-- Adds tables for admin broadcast emails and unsubscribe tracking
-- ═══════════════════════════════════════════════════════════════════

-- Broadcast log — one row per sent broadcast
CREATE TABLE public.email_broadcast (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  category        text        NOT NULL CHECK (category IN ('release_notes', 'newsletter', 'blog', 'announcement')),
  subject         text        NOT NULL,
  body_markdown   text        NOT NULL,
  body_html       text        NOT NULL,
  recipient_count int         NOT NULL DEFAULT 0,
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  error_message   text,
  created_on      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz
);

ALTER TABLE public.email_broadcast ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access on email_broadcast"
  ON public.email_broadcast FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND is_admin = true));

CREATE INDEX idx_email_broadcast_sent_at ON public.email_broadcast(sent_at DESC);
CREATE INDEX idx_email_broadcast_category ON public.email_broadcast(category);

-- CAN-SPAM unsubscribe tracking (per-category opt-out)
CREATE TABLE public.email_unsubscribe (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        NOT NULL,
  category    text        NOT NULL CHECK (category IN ('release_notes', 'newsletter', 'blog', 'announcement', 'all')),
  created_on  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_unsubscribe ENABLE ROW LEVEL SECURITY;

-- No user-level RLS policies — all access via service role in API routes
-- Tokens are HMAC-based, computed at send time, no stored token column needed

CREATE UNIQUE INDEX idx_email_unsubscribe_email_category ON public.email_unsubscribe(email, category);
CREATE INDEX idx_email_unsubscribe_email ON public.email_unsubscribe(email);

-- Storage bucket for broadcast images (run via Supabase dashboard or CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('broadcast-images', 'broadcast-images', true);
