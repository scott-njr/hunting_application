-- Grant all 6 active modules at free tier on new member signup (previously only hunting)
-- Also backfill existing users who are missing module subscriptions

-- Replace the trigger function to grant ALL modules instead of just hunting
CREATE OR REPLACE FUNCTION public.handle_new_member_module_grant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
  VALUES
    (NEW.id, 'hunting',  'free', 'active'),
    (NEW.id, 'archery',  'free', 'active'),
    (NEW.id, 'firearms', 'free', 'active'),
    (NEW.id, 'medical',  'free', 'active'),
    (NEW.id, 'fishing',  'free', 'active'),
    (NEW.id, 'fitness',  'free', 'active')
  ON CONFLICT (user_id, module_slug) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill: grant free tier for all modules to existing users who don't have them yet
INSERT INTO public.module_subscriptions (user_id, module_slug, tier, status)
SELECT m.id, mod.slug, 'free', 'active'
FROM public.members m
CROSS JOIN public.modules mod
WHERE mod.is_active = true
ON CONFLICT (user_id, module_slug) DO NOTHING;
