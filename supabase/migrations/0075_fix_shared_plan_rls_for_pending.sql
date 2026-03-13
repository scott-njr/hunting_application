-- Fix: allow target user to read source plan when share is pending (for preview + accept)
-- Previously only allowed reading when status='accepted', which blocked the accept flow entirely.

-- Drop and recreate the cross-plan visibility policy on fitness_training_plans
DROP POLICY IF EXISTS "shared_training_plans_select" ON fitness_training_plans;

CREATE POLICY "shared_training_plans_select" ON fitness_training_plans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fitness_shared_plans sp
      WHERE sp.status IN ('pending', 'accepted')
        AND (
          -- Target user can read source plan (pending = preview/accept, accepted = compare)
          (sp.source_plan_id = fitness_training_plans.id AND sp.target_user_id = auth.uid())
          -- Source user can read target plan (accepted only, for compare)
          OR (sp.target_plan_id = fitness_training_plans.id AND sp.source_user_id = auth.uid() AND sp.status = 'accepted')
        )
    )
  );
