-- Shared workout plans: allows friends to share plans and compare progress
CREATE TABLE shared_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_plan_id   UUID NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  source_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_plan_id   UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  target_user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'accepted', 'declined')),
  shared_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at      TIMESTAMPTZ,

  CONSTRAINT unique_share_per_target UNIQUE (source_plan_id, target_user_id),
  CONSTRAINT no_self_share CHECK (source_user_id != target_user_id)
);

-- Indexes
CREATE INDEX idx_shared_plans_source ON shared_plans(source_user_id, status);
CREATE INDEX idx_shared_plans_target ON shared_plans(target_user_id, status);
CREATE INDEX idx_shared_plans_source_plan ON shared_plans(source_plan_id);
CREATE INDEX idx_shared_plans_target_plan ON shared_plans(target_plan_id) WHERE target_plan_id IS NOT NULL;

-- RLS
ALTER TABLE shared_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shared_plans_select" ON shared_plans
  FOR SELECT TO authenticated
  USING (auth.uid() = source_user_id OR auth.uid() = target_user_id);

CREATE POLICY "shared_plans_insert" ON shared_plans
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = source_user_id);

CREATE POLICY "shared_plans_update" ON shared_plans
  FOR UPDATE TO authenticated
  USING (auth.uid() = target_user_id);

CREATE POLICY "shared_plans_delete" ON shared_plans
  FOR DELETE TO authenticated
  USING (auth.uid() = source_user_id OR auth.uid() = target_user_id);

-- Cross-plan visibility: let linked users see each other's training plans
-- (additive with existing "training_plans_select" — Postgres ORs multiple SELECT policies)
CREATE POLICY "shared_training_plans_select" ON training_plans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_plans sp
      WHERE sp.status = 'accepted'
        AND sp.target_plan_id IS NOT NULL
        AND (
          (sp.source_plan_id = training_plans.id AND sp.target_user_id = auth.uid())
          OR (sp.target_plan_id = training_plans.id AND sp.source_user_id = auth.uid())
        )
    )
  );

-- Cross-plan visibility: let linked users see each other's workout logs
-- (additive with existing "plan_workout_logs_select")
CREATE POLICY "shared_plan_logs_select" ON plan_workout_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shared_plans sp
      WHERE sp.status = 'accepted'
        AND sp.target_plan_id IS NOT NULL
        AND (
          (sp.source_plan_id = plan_workout_logs.plan_id AND sp.target_user_id = auth.uid())
          OR (sp.target_plan_id = plan_workout_logs.plan_id AND sp.source_user_id = auth.uid())
        )
    )
  );
