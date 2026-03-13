-- ============================================================================
-- 0082: Add firearms_profile table, target photo analysis columns, storage bucket
-- ============================================================================

-- ─── firearms_profile table ─────────────────────────────────────────────────

CREATE TABLE firearms_profile (
  id          UUID PRIMARY KEY REFERENCES user_profile(id) ON DELETE CASCADE,
  dominant_hand TEXT CHECK (dominant_hand IN ('left', 'right')),
  created_on  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE firearms_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own firearms profile"
  ON firearms_profile FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own firearms profile"
  ON firearms_profile FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own firearms profile"
  ON firearms_profile FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_on
CREATE TRIGGER set_firearms_profile_updated_on
  BEFORE UPDATE ON firearms_profile
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_on();

-- ─── Target analysis columns on firearms_shot_session ───────────────────────

ALTER TABLE firearms_shot_session
  ADD COLUMN target_photo_url TEXT,
  ADD COLUMN target_analysis  JSONB;

-- ─── Storage bucket for target photos ───────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('firearms-targets', 'firearms-targets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their target photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'firearms-targets' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Target photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'firearms-targets');
