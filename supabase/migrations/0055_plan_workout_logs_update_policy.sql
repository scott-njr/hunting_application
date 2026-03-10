-- Add missing UPDATE policy for plan_workout_logs.
-- Without this, upsert (saving notes on already-logged sessions) fails silently
-- because RLS blocks the UPDATE portion of the upsert.
CREATE POLICY "plan_workout_logs_update" ON plan_workout_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
