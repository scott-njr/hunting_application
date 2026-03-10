-- Gear checklist — lightweight owned/packed tracking per user
-- Each row = user owns/has that item slug. Absence = needs it.
-- Default item lists are hardcoded in the frontend (no content migrations needed).

CREATE TABLE IF NOT EXISTS public.gear_checklist (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, item_slug)
);

ALTER TABLE public.gear_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checklist"
  ON public.gear_checklist
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
