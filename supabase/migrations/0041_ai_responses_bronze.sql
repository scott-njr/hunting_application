-- Bronze layer: store every raw AI response for debugging and audit

CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  feature TEXT NOT NULL,
  input_length INTEGER NOT NULL,
  output_length INTEGER NOT NULL,
  raw_response TEXT NOT NULL,
  tokens_input INTEGER,
  tokens_output INTEGER,
  parse_success BOOLEAN NOT NULL DEFAULT true,
  flags TEXT[] NOT NULL DEFAULT '{}',
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_responses ENABLE ROW LEVEL SECURITY;

-- Only service role can insert (server-side only)
-- No user-facing policies needed

-- Index for debugging queries
CREATE INDEX idx_ai_responses_user ON ai_responses(user_id, created_at DESC);
CREATE INDEX idx_ai_responses_feature ON ai_responses(module, feature, created_at DESC);
CREATE INDEX idx_ai_responses_failures ON ai_responses(parse_success) WHERE parse_success = false;
