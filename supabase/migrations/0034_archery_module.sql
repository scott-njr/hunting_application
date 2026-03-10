-- Add Archery as an active module
-- Archery is a standalone module with courses, community, and profile
-- It shares the same platform infrastructure as Hunting but has its own content

INSERT INTO public.modules (slug, name, description, icon, is_active, sort_order)
VALUES ('archery', 'Archery', 'Shot training, bow setup, competition prep, and coaching.', 'Target', true, 2)
ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- Bump existing modules sort_order to make room for archery at position 2
UPDATE public.modules SET sort_order = sort_order + 1
WHERE slug NOT IN ('hunting', 'archery') AND sort_order >= 2;

-- Auto-grant archery:free to all existing members (same pattern as hunting in 0017)
INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
SELECT id, 'archery', 'free', 'active'
FROM public.members
ON CONFLICT (user_id, module_slug) DO NOTHING;

-- Auto-grant archery:free to new signups via trigger
-- (Extends the existing handle_new_member_module trigger)
CREATE OR REPLACE FUNCTION public.handle_new_member_archery()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
  VALUES (NEW.id, 'archery', 'free', 'active')
  ON CONFLICT (user_id, module_slug) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_member_created_archery
  AFTER INSERT ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_member_archery();
