-- Utah 2026 big game draw data
-- Application window: approximately Jan 1 – Feb 2, 2026 (CLOSED as of Mar 2026)
-- $10 non-refundable application fee per species
-- Bonus point system: points increase draw odds (points + 1 entries in draw)
-- Utah has three tiers: General, Limited Entry (LE), and Once-in-a-Lifetime (OIAL)
-- Source: https://wildlife.utah.gov/hunting/main-hunting-page/big-game/drawings.html
-- TODO: verify exact 2026 deadline (historically first Sunday in February) and results date

WITH ut_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Utah',
    'UT',
    2026,
    'https://wildlife.utah.gov/hunting/main-hunting-page/big-game/drawings.html',
    'Utah uses hunting units numbered statewide. Hunts are classified as General (OTC or easy draw), Limited Entry (LE — competitive draw), and Once-in-a-Lifetime (OIAL — moose, bison, desert bighorn, rocky mountain goat). Research unit quality and point requirements carefully before applying. Utah publishes draw odds annually.',
    'Utah''s bonus point system gives you (points + 1) entries in the draw each year. Points accumulate slowly in OIAL categories — many hunters wait 20+ years for moose or bison. General deer and elk licenses are available OTC without a draw in many units. Apply for LE and OIAL hunts every year to build points.',
    '[
      {"step":1,"label":"Purchase a Utah hunting license","detail":"A valid Utah hunting license is required to apply for draw hunts. Residents and nonresidents purchase online through the Utah Wildlife Resources portal.","link":{"label":"Utah Wildlife Resources","url":"https://wildlife.utah.gov/hunting"}},
      {"step":2,"label":"Create or log in to your Utah WR account","detail":"All draw applications are submitted through the Utah Wildlife Resources online system. Your account tracks your bonus points by species.","link":{"label":"Utah Wildlife Resources Portal","url":"https://wildlife.utah.gov/hunting/main-hunting-page/big-game/drawings.html"}},
      {"step":3,"label":"Understand the three hunt tiers","detail":"General hunts: OTC or easily available. Limited Entry (LE): competitive draw with bonus points. Once-in-a-Lifetime (OIAL): moose, desert bighorn sheep, rocky mountain goat, and bison — you can only draw each tag once. Choose your tier and species carefully."},
      {"step":4,"label":"Pay the $10 non-refundable application fee","detail":"Utah charges $10 per species application fee at time of submission. This fee is non-refundable regardless of draw outcome. Budget accordingly when applying for multiple species.","warning":true},
      {"step":5,"label":"Submit by the early February deadline","detail":"The draw application window opens January 1 and closes in early February (historically the first Sunday in February). Late applications are not accepted."},
      {"step":6,"label":"Bonus points improve your odds each year","detail":"Utah''s bonus point system gives you (points + 1) entries in the draw. With 4 points, you get 5 entries. Points accumulate each year you apply and don''t draw. Apply every year to maximize long-term odds."},
      {"step":7,"label":"Results posted in May — check your account","detail":"Draw results are posted in May in your Utah Wildlife Resources online account. If drawn, you will receive an email and must purchase your tag. Bonus points are zeroed for the species you drew."}
    ]'::jsonb
  )
  RETURNING id
)
INSERT INTO public.draw_species (
  draw_state_id,
  state_code,
  year,
  species,
  seasons,
  open_date,
  deadline,
  results_date,
  payment_deadline,
  secondary_open,
  secondary_close,
  secondary_results,
  leftover_date,
  status,
  note
)
SELECT
  ut_state.id,
  'UT',
  2026,
  s.species,
  s.seasons,
  'Jan 1, 2026',
  'Feb 2, 2026',   -- TODO: verify exact 2026 deadline (typically first Sunday in Feb)
  'May 2026',      -- TODO: verify
  'May 2026',
  '',
  '',
  '',
  'Jun 2026',      -- TODO: verify leftover/OTC sale date
  'closed',
  s.note
FROM ut_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Both general (OTC in many units) and Limited Entry tags available. LE elk tags in Utah offer exceptional bull quality — some units are world-class. Bonus points give meaningful advantages at 3–5+ points for top LE units.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'General OTC deer tags available for most units. Limited Entry units have trophy-class bucks and require 5–15+ bonus points for top areas. Utah is one of the premier mule deer states in the West.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Most Utah pronghorn hunting requires a draw. Tags are competitive in trophy units but more attainable in many areas. Utah produces excellent trophy pronghorn.'),
  ('moose',         ARRAY['rifle']::text[],                          'Once-in-a-Lifetime category — you can only draw a Utah moose tag once. Expect 15–25+ bonus points for most units. Plan this as your highest-priority long-game application.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Rocky Mountain bighorn is Limited Entry; Desert bighorn is Once-in-a-Lifetime. Desert bighorn requires 20+ bonus points in most units. Some of the most sought-after tags in the western U.S.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Once-in-a-Lifetime category. Utah mountain goat tags are rare with exceptional success rates. Expect 15–20+ bonus points. Apply every year — these tags are worth the wait.'),
  ('bison',         ARRAY['rifle']::text[],                          'Once-in-a-Lifetime category. Utah offers bison hunts on Antelope Island and Henry Mountains. Extremely limited quota. One of the rarest hunting experiences in North America.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Utah black bear hunting is draw-only for spring hunts. Tags are moderately competitive. Some units offer excellent bear populations in the Book Cliffs and Uinta Mountains.')
) AS s(species, seasons, note);
