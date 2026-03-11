-- Shared individual items (view-only workout/meal references between friends)
CREATE TABLE public.fitness_shared_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type       TEXT NOT NULL CHECK (item_type IN ('run_session', 'strength_session', 'meal')),
  item_snapshot   JSONB NOT NULL,
  source_plan_id  UUID REFERENCES public.fitness_training_plans(id) ON DELETE SET NULL,
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fitness_shared_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see items shared to/from them"
  ON public.fitness_shared_items FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert their own shares"
  ON public.fitness_shared_items FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE INDEX idx_fitness_shared_items_recipient
  ON public.fitness_shared_items(recipient_id, created_at DESC);


-- Workout challenges between friends (score-based like WOW)
CREATE TABLE public.fitness_challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenged_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type       TEXT NOT NULL CHECK (item_type IN ('run_session', 'strength_session')),
  item_snapshot   JSONB NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  scoring_type    TEXT NOT NULL CHECK (scoring_type IN ('time', 'reps')),
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  CONSTRAINT no_self_challenge CHECK (challenger_id != challenged_id)
);

ALTER TABLE public.fitness_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can see their challenges"
  ON public.fitness_challenges FOR SELECT
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges"
  ON public.fitness_challenges FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Participants can update challenges"
  ON public.fitness_challenges FOR UPDATE
  USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE INDEX idx_fitness_challenges_challenger
  ON public.fitness_challenges(challenger_id, status);

CREATE INDEX idx_fitness_challenges_challenged
  ON public.fitness_challenges(challenged_id, status);


-- Challenge score submissions
CREATE TABLE public.fitness_challenge_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id    UUID NOT NULL REFERENCES public.fitness_challenges(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_value     NUMERIC NOT NULL,
  score_display   TEXT NOT NULL,
  scaling         TEXT NOT NULL DEFAULT 'rx' CHECK (scaling IN ('rx', 'scaled', 'beginner')),
  notes           TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_submission_per_user UNIQUE (challenge_id, user_id)
);

ALTER TABLE public.fitness_challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge participants can see submissions"
  ON public.fitness_challenge_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.fitness_challenges c
      WHERE c.id = challenge_id
        AND (c.challenger_id = auth.uid() OR c.challenged_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own submissions"
  ON public.fitness_challenge_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON public.fitness_challenge_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_fitness_challenge_submissions_challenge
  ON public.fitness_challenge_submissions(challenge_id);
