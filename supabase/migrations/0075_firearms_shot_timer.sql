-- ─── Firearms Shot Timer ─────────────────────────────────────────────────────

-- Sessions table — one per training session
CREATE TABLE public.firearms_shot_session (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  mode            TEXT NOT NULL DEFAULT 'timer' CHECK (mode IN ('timer', 'stopwatch', 'spy')),
  sensitivity     SMALLINT NOT NULL DEFAULT 4 CHECK (sensitivity BETWEEN 1 AND 8),
  delay_mode      TEXT NOT NULL DEFAULT 'random' CHECK (delay_mode IN ('fixed', 'random', 'instant')),
  delay_min_ms    INT NOT NULL DEFAULT 2000,
  delay_max_ms    INT NOT NULL DEFAULT 5000,
  par_times_ms    INT[] NOT NULL DEFAULT '{}',
  points          NUMERIC(6,1) NOT NULL DEFAULT 0,
  notes           TEXT,
  total_strings   SMALLINT NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_on      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_firearms_shot_session_user ON public.firearms_shot_session (user_id);
CREATE INDEX idx_firearms_shot_session_created ON public.firearms_shot_session (user_id, created_on DESC);

CREATE TRIGGER set_firearms_shot_session_updated_on
  BEFORE UPDATE ON public.firearms_shot_session
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

ALTER TABLE public.firearms_shot_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shot_session_select" ON public.firearms_shot_session
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shot_session_insert" ON public.firearms_shot_session
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shot_session_update" ON public.firearms_shot_session
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shot_session_delete" ON public.firearms_shot_session
  FOR DELETE USING (auth.uid() = user_id);

-- Shot strings table — up to 10 per session, each with up to 99 shots
CREATE TABLE public.firearms_shot_string (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.firearms_shot_session(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  string_number     SMALLINT NOT NULL CHECK (string_number BETWEEN 1 AND 10),
  shots_ms          INT[] NOT NULL DEFAULT '{}',
  shot_amplitudes   SMALLINT[] NOT NULL DEFAULT '{}',
  amplitude_samples JSONB,
  split_times_ms    INT[] NOT NULL DEFAULT '{}',
  total_time_ms     INT,
  shot_count        SMALLINT NOT NULL DEFAULT 0,
  points            NUMERIC(6,1),
  hit_factor        NUMERIC(8,4),
  par_hit           BOOLEAN,
  created_on        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_on        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_firearms_shot_string_session ON public.firearms_shot_string (session_id);
CREATE INDEX idx_firearms_shot_string_user ON public.firearms_shot_string (user_id);
CREATE UNIQUE INDEX idx_firearms_shot_string_unique
  ON public.firearms_shot_string (session_id, string_number);

CREATE TRIGGER set_firearms_shot_string_updated_on
  BEFORE UPDATE ON public.firearms_shot_string
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_on();

ALTER TABLE public.firearms_shot_string ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shot_string_select" ON public.firearms_shot_string
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "shot_string_insert" ON public.firearms_shot_string
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "shot_string_update" ON public.firearms_shot_string
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "shot_string_delete" ON public.firearms_shot_string
  FOR DELETE USING (auth.uid() = user_id);
