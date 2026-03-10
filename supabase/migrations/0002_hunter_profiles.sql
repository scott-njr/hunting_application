-- Hunter preferences/profile table
CREATE TABLE public.hunter_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Weapons
  weapon_types TEXT[] NOT NULL DEFAULT '{}',
  -- Values: 'rifle', 'muzzleloader', 'archery_compound', 'archery_recurve', 'archery_crossbow', 'handgun', 'shotgun', 'airgun'

  -- Species / animals
  target_species TEXT[] NOT NULL DEFAULT '{}',
  -- Values: 'elk', 'mule_deer', 'whitetail', 'pronghorn', 'black_bear', 'mountain_lion', 'bighorn_sheep', 'mountain_goat', 'moose', 'bison', 'turkey', 'waterfowl', 'upland', 'small_game'

  -- States of interest (2-letter codes)
  states_of_interest TEXT[] NOT NULL DEFAULT '{}',

  -- Hunt access type preferences
  hunt_access_types TEXT[] NOT NULL DEFAULT '{}',
  -- Values: 'otc', 'draw', 'quota_permit', 'walk_in_access', 'nwr_permit', 'license_only'

  -- Experience
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'experienced', 'expert')),
  years_hunting INT,

  -- Physical / logistics
  physical_condition TEXT CHECK (physical_condition IN ('light', 'moderate', 'strenuous', 'extreme')),
  -- light = flat/short hikes; moderate = 5-10mi day; strenuous = backcountry capable; extreme = mountaineering level

  -- Budget (annual hunting budget estimate)
  annual_budget TEXT CHECK (annual_budget IN ('under_500', '500_2000', '2000_5000', '5000_15000', '15000_plus')),

  -- Hunt style
  hunt_styles TEXT[] NOT NULL DEFAULT '{}',
  -- Values: 'diy_public', 'guided', 'outfitter', 'solo', 'camp_based', 'day_hunt', 'backpack', 'horse_pack', 'atv_accessible'

  -- Training interests
  training_interests TEXT[] NOT NULL DEFAULT '{}',
  -- Values: 'firearms_fundamentals', 'long_range_shooting', 'archery_form', 'medical_wilderness', 'first_aid', 'survival_skills', 'land_navigation', 'physical_fitness', 'butchering', 'scouting_glassing'

  -- Location
  home_city TEXT,
  home_state TEXT,
  nearest_airport TEXT,   -- IATA code (e.g. 'DFW', 'DEN')
  nearest_airport_name TEXT,

  -- Travel preferences
  willing_to_fly BOOLEAN,
  max_drive_hours INT,         -- max hours willing to drive from home
  typical_trip_days INT,       -- typical number of days per hunting trip
  max_trips_per_year INT,      -- how many trips per year they're planning

  -- Metadata
  profile_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id)
);

-- RLS
ALTER TABLE public.hunter_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.hunter_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.hunter_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.hunter_profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
CREATE TRIGGER handle_hunter_profiles_updated_at
  BEFORE UPDATE ON public.hunter_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
