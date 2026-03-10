-- Montana 2026 draw data
-- Key difference from CO: species have DIFFERENT deadlines by group
--   Elk, Deer, Black Bear → Apr 1 deadline (open now)
--   Moose, Bighorn Sheep, Mountain Goat, Bison → May 1 deadline (upcoming)
--   Pronghorn → Jun 1 deadline (upcoming)
-- Applications are FREE to submit — hunters only pay if drawn
-- Source: https://fwp.mt.gov/buyandapply/hunting-licenses/application-drawing-dates

WITH mt_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Montana',
    'MT',
    2026,
    'https://myfwp.mt.gov',
    'Montana uses numbered Hunt Districts instead of GMUs. Each district has its own quota and season structure. Look up district-specific harvest reports on FWP before choosing — some districts have high success rates, others are very competitive.',
    'Montana OTC Elk B and Deer B licenses now go on sale June 15 (not April as in past years). If you don''t draw a special permit, plan your OTC hunt accordingly. B licenses are district-specific and popular units sell out.',
    '[
      {"step":1,"label":"Purchase a base Montana hunting license","detail":"Residents need a base license. Nonresidents need a Nonresident Combination license or a species-specific license before applying. Purchase at any FWP license agent or online.","link":{"label":"MyFWP License Purchase","url":"https://myfwp.mt.gov"}},
      {"step":2,"label":"Create or log in to your MyFWP account","detail":"All Montana special permit applications are submitted through MyFWP. Create a free account if you don''t have one — you''ll need your FWP customer ID.","link":{"label":"MyFWP Portal","url":"https://myfwp.mt.gov"}},
      {"step":3,"label":"Review the current FWP regulations and district reports","detail":"Montana publishes hunting regulations and district-specific harvest statistics. Check point requirements and quotas before selecting your district.","link":{"label":"FWP Regulations","url":"https://fwp.mt.gov/hunting/regulations"}},
      {"step":4,"label":"Submit your permit application by the species deadline","detail":"Applications are FREE to submit — you do not pay unless you draw. Different species have different deadlines (see dates above). You can apply for multiple species in the same year."},
      {"step":5,"label":"Application is free — you only pay if drawn","detail":"Unlike some states, Montana charges no application fee. If you draw a permit, you are charged for the license at that time. Points are retained if you don''t draw.","warning":false},
      {"step":6,"label":"Bonus points are squared to improve odds","detail":"Each year you apply and don''t draw, you earn a bonus point. Your chances in the draw are proportional to your points squared — 3 points = 9 entries, 4 points = 16 entries, etc. Apply every year even if you don''t expect to draw."},
      {"step":7,"label":"Check results in MyFWP","detail":"Draw results are posted in your MyFWP account. You will also receive an email notification. If drawn, your license is charged automatically."}
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
  mt_state.id,
  'MT',
  2026,
  s.species,
  s.seasons,
  'Mar 1, 2026',
  s.deadline,
  s.results_date,
  s.results_date,  -- payment charged at draw, same as results
  '',              -- no formal secondary draw
  '',
  '',
  'Jun 15, 2026',  -- OTC Elk B / Deer B go on sale
  s.status,
  s.note
FROM mt_state,
(VALUES
  -- Group 1: Elk, Deer, Black Bear — deadline Apr 1 (OPEN NOW as of Mar 2026)
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Apr 1, 2026',  'Mid-Apr 2026', 'open',     NULL::text),
  ('mule_deer',     ARRAY['archery','rifle']::text[],                'Apr 1, 2026',  'Mid-Apr 2026', 'open',     NULL::text),
  ('whitetail',     ARRAY['archery','rifle']::text[],                'Apr 1, 2026',  'Mid-Apr 2026', 'open',     NULL::text),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Apr 1, 2026',  'Mid-Apr 2026', 'open',     NULL::text),
  -- Group 2: Moose, Bighorn Sheep, Mountain Goat, Bison — deadline May 1 (upcoming)
  ('moose',         ARRAY['rifle']::text[],                          'May 1, 2026',  'Mid-May 2026', 'upcoming', 'Extremely limited permits — statewide quota often under 200 tags. Expect 10+ bonus points to draw most districts.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'May 1, 2026',  'Mid-May 2026', 'upcoming', 'One of the hardest draws in the West. Most districts require 15–20+ points. Once-in-a-lifetime trophy opportunity.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'May 1, 2026',  'Mid-May 2026', 'upcoming', NULL::text),
  ('bison',         ARRAY['rifle']::text[],                          'May 1, 2026',  'Mid-May 2026', 'upcoming', 'Limited tribal and state-permitted bison hunts. Check FWP for availability.'),
  -- Group 3: Pronghorn — deadline Jun 1 (upcoming)
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Jun 1, 2026',  'Mid-Jun 2026', 'upcoming', NULL::text)
) AS s(species, seasons, deadline, results_date, status, note);
