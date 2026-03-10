-- ─── Baseline Tests ──────────────────────────────────────────────────────────
CREATE TABLE baseline_tests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_time_seconds INTEGER NOT NULL,
  pushups         INTEGER NOT NULL,
  situps          INTEGER NOT NULL,
  pullups         INTEGER NOT NULL,
  notes           TEXT,
  tested_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE baseline_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baseline_tests_select" ON baseline_tests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "baseline_tests_insert" ON baseline_tests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "baseline_tests_update" ON baseline_tests
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "baseline_tests_delete" ON baseline_tests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_baseline_tests_user_date ON baseline_tests(user_id, tested_at DESC);

-- ─── Training Plans ──────────────────────────────────────────────────────────
CREATE TABLE training_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type   TEXT NOT NULL CHECK (plan_type IN ('run', 'strength')),
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'completed', 'abandoned')),
  config      JSONB NOT NULL DEFAULT '{}',
  plan_data   JSONB NOT NULL DEFAULT '{}',
  goal        TEXT,
  weeks_total INTEGER NOT NULL DEFAULT 8,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_plans_select" ON training_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "training_plans_insert" ON training_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "training_plans_update" ON training_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "training_plans_delete" ON training_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX idx_training_plans_active
  ON training_plans(user_id, plan_type)
  WHERE status = 'active';

CREATE INDEX idx_training_plans_user ON training_plans(user_id, plan_type, status);

-- ─── Plan Workout Logs ───────────────────────────────────────────────────────
CREATE TABLE plan_workout_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number    INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  notes          TEXT,
  completed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, week_number, session_number)
);

ALTER TABLE plan_workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_workout_logs_select" ON plan_workout_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "plan_workout_logs_insert" ON plan_workout_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "plan_workout_logs_delete" ON plan_workout_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_plan_workout_logs_plan ON plan_workout_logs(plan_id, week_number, session_number);
CREATE INDEX idx_plan_workout_logs_user ON plan_workout_logs(user_id, completed_at DESC);
