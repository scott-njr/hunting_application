-- Members table
-- Links to auth.users — row auto-created via trigger on signup

CREATE TABLE public.members (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (membership_tier IN ('free', 'basic', 'pro', 'elite')),
  membership_status TEXT NOT NULL DEFAULT 'active'
    CHECK (membership_status IN ('active', 'inactive', 'cancelled')),
  stripe_customer_id TEXT,
  ai_queries_this_month INT NOT NULL DEFAULT 0,
  ai_queries_reset_date TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Users can read their own record
CREATE POLICY "Users can view own member record"
  ON public.members FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own record — but cannot change tier or status
CREATE POLICY "Users can update own profile"
  ON public.members FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND membership_tier = (SELECT membership_tier FROM public.members WHERE id = auth.uid())
    AND membership_status = (SELECT membership_status FROM public.members WHERE id = auth.uid())
  );

-- Auto-insert trigger: creates member row when user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.members (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
