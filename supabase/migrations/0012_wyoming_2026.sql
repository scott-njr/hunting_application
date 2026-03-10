-- Wyoming 2026 big game draw data
-- Single application window for all species: Nov 1, 2025 – Jan 31, 2026 (CLOSED as of Mar 2026)
-- $15 non-refundable application fee per species at time of application
-- Preference point system — straight preference ordering, highest points drawn first
-- Up to 6 ranked choices per species
-- Source: https://wgfd.wyo.gov/Hunting/Apply-for-Hunts
-- TODO: verify exact 2026 results release date (historically April)

WITH wy_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Wyoming',
    'WY',
    2026,
    'https://wgfd.wyo.gov/Hunting/Apply-for-Hunts',
    'Wyoming uses Hunt Areas for elk and deer, and numbered units for pronghorn, moose, sheep, and goat. The WGFD publishes draw odds and harvest statistics by hunt area — review these carefully before selecting choices. High-demand areas for elk and deer may require 5–10+ preference points.',
    'Wyoming charges a $15 non-refundable application fee per species. This fee is charged at time of application regardless of draw outcome. Most elk and deer hunting for residents is available via general OTC license — the draw is for limited quota units and special tags only.',
    '[
      {"step":1,"label":"Purchase a Wyoming hunting license","detail":"Both residents and nonresidents must hold a valid Wyoming hunting license before applying for limited quota draw hunts. Purchase online through the Wyoming Wildlife Licensing System or at any license vendor.","link":{"label":"Wyoming Wildlife Licensing System","url":"https://wgfd.wyo.gov/Hunting/Apply-for-Hunts"}},
      {"step":2,"label":"Create or log in to your WGFD account","detail":"All draw applications are submitted through the Wyoming Wildlife Licensing System online portal. You will need a WGFD customer ID number to log in.","link":{"label":"WGFD Portal","url":"https://wgfd.wyo.gov/Hunting/Apply-for-Hunts"}},
      {"step":3,"label":"Review draw odds and select your hunt areas","detail":"Wyoming publishes draw odds by species and hunt area. You may submit up to 6 ranked choices per species. Research point requirements carefully — popular areas can require many years of accumulation.","link":{"label":"WGFD Draw Odds Tool","url":"https://wgfd.wyo.gov/Wildlife-in-Wyoming/Hunting-Odds"}},
      {"step":4,"label":"Pay the $15 non-refundable application fee","detail":"Wyoming charges $15 per species application fee, payable at the time you submit. This fee is non-refundable even if you do not draw. Budget accordingly if applying for multiple species.","warning":true},
      {"step":5,"label":"Submit by the January 31 deadline","detail":"The draw application window opens November 1 of the prior year and closes January 31. Late applications are not accepted under any circumstances."},
      {"step":6,"label":"Preference points accumulate each year you don''t draw","detail":"Wyoming uses a preference point system. Each year you apply and are not drawn, you earn one point. Hunters with more points are given priority in the draw. Points are species-specific and carry forward indefinitely."},
      {"step":7,"label":"Check results in April and purchase your tag","detail":"Draw results are posted in your WGFD online account in April. If drawn, you will be notified by email and must purchase your license and tag. Preference points are reset to zero for the species you drew."}
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
  wy_state.id,
  'WY',
  2026,
  s.species,
  s.seasons,
  'Nov 1, 2025',
  'Jan 31, 2026',
  'Apr 2026',     -- TODO: verify exact date
  'Apr 2026',     -- license purchased at draw
  '',             -- no formal secondary draw
  '',
  '',
  '',             -- leftover tags available directly if quota unfilled, varies by species
  'closed',
  s.note
FROM wy_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Limited quota units only — most WY elk hunting is OTC general license for residents. Nonresidents must draw for nearly all units. Top units require 5–10+ points.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'General deer licenses available OTC for most areas. Limited quota draw required for premium units. Nonresident demand is high for top mule deer areas.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Most pronghorn tags require a draw. Wyoming is the top state for pronghorn hunting — tags are relatively attainable compared to sheep or moose, but popular units fill quickly.'),
  ('moose',         ARRAY['rifle']::text[],                          'Extremely limited statewide quota. Expect 10–20+ preference points for most areas. Plan this as a long-term goal — a once-in-a-lifetime caliber tag.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'One of the most difficult draws in Wyoming. Most units require 15–25+ preference points. Some areas have bonus point systems for residents only.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Very limited permits statewide. Expect 10–20+ preference points. Wyoming goat tags are exceptional — most units have excellent success rates once drawn.'),
  ('bison',         ARRAY['rifle']::text[],                          'Extremely rare permits for specific herds. Check WGFD for current availability by herd unit. Not all herds are open every year.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Bear tags available OTC in most regions. Draw required only in specific controlled hunt areas. Check regulations for your target unit.')
) AS s(species, seasons, note);
