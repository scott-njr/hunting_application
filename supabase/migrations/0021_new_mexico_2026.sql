-- New Mexico 2026 big game draw data
-- Application window: ~Jan 15 – Mar 18, 2026 at 5pm MT (OPEN as of Mar 5 — deadline in 13 days!)
-- Bear/Turkey draw closed Feb 11, 2026; all other species close Mar 18
-- PURE RANDOM DRAW — no preference point system; every hunter starts fresh each year
-- Non-residents must purchase hunting license (~$65) + tag fee upfront (refunded if not drawn, minus app fee)
-- Quota pools: Residents 84%, Outfitter 10%, Non-resident DIY 6%
-- Source: https://wildlife.dgf.nm.gov/hunting/applications-and-draw-information/

WITH nm_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'New Mexico',
    'NM',
    2026,
    'https://onlinesales.wildlife.state.nm.us',
    'New Mexico uses Game Management Units (GMUs) numbered by region — over 90 units statewide. Units are grouped into Northwest, Northeast, Central, Southeast, and Southwest regions. Research the NMDGF Hunt Atlas for unit-level harvest data, draw odds, and access maps. Hunt codes encode unit + season + weapon + sex (e.g., ME-045-R-B = elk, unit 45, rifle, bull). The Gila Wilderness and Carson/Santa Fe National Forests are iconic NM hunting destinations.',
    'New Mexico is one of the only western states using a PURE RANDOM DRAW — no preference or bonus points. Every hunter has the same draw odds every year, regardless of how many years they''ve applied. This makes NM an excellent state to apply in every year, especially for first-timers chasing premium elk or oryx tags. Non-residents receive 6% of the tag pool (DIY), residents receive 84%. Your tag fee is charged at application and refunded if you don''t draw — minus the non-refundable application fee.',
    '[
      {"step":1,"label":"Purchase a New Mexico hunting license","detail":"A valid New Mexico non-resident hunting license (~$65) is required before submitting a draw application. You also need the Habitat Management & Access Validation (~$4) and a Habitat Stamp (~$10). These are purchased through the NMDGF online portal.","link":{"label":"NMDGF Online Sales","url":"https://onlinesales.wildlife.state.nm.us"}},
      {"step":2,"label":"Create or log in to your NMDGF account","detail":"All applications are submitted through the New Mexico Game & Fish online portal. Create a free Customer ID (CIN) account with your name, date of birth, and contact info. This is your permanent NMDGF account — keep your CIN number.","link":{"label":"NMDGF Portal","url":"https://onlinesales.wildlife.state.nm.us"}},
      {"step":3,"label":"Select species and enter up to 3 hunt choices","detail":"New Mexico allows up to 3 hunt code choices per species application, processed in order. Research units in the Hunt Atlas — knowing your backup choices matters since all 3 are evaluated before moving to the next applicant. Select the hunt code (unit + weapon + sex + season).","link":{"label":"NM Hunt Atlas","url":"https://www.wildlife.state.nm.us/hunting/huntatlas/"}},
      {"step":4,"label":"Tag fee is charged upfront — refunded if not drawn","detail":"Unlike most states, New Mexico charges the full tag fee at time of application (e.g., elk ~$773 NR, deer ~$368 NR, pronghorn ~$283 NR). If you are not drawn, the tag fee is refunded to your credit card. The application fee ($13 non-resident, $7 resident) is non-refundable.","warning":true},
      {"step":5,"label":"Submit by March 18, 2026 at 5:00 PM MT","detail":"The application window closes March 18, 2026 at 5:00 PM Mountain Time. Bear and turkey applications closed February 11. Only one application per species is allowed per hunter per year."},
      {"step":6,"label":"No preference points — pure random draw","detail":"New Mexico does not use preference or bonus points. Every applicant has the same odds every year based on their pool (resident vs. non-resident). Residents receive 84% of tags, non-resident DIY 6%, outfitter quota 10%. Apply every year — your odds are identical whether it''s your first time or your twentieth."},
      {"step":7,"label":"Results on April 22, 2026 — returned tags sold June","detail":"Draw results are posted on April 22, 2026 in your NMDGF account. If you drew, your tag is confirmed and credit card is kept. If not drawn, your tag fee is refunded. Returned and unused tags go on sale in June on a first-come, first-served basis through the same online portal.","link":{"label":"Check Results","url":"https://onlinesales.wildlife.state.nm.us"}}
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
  nm_state.id,
  'NM',
  2026,
  s.species,
  s.seasons,
  s.open_date,
  s.deadline,
  s.results_date,
  s.results_date,   -- tag fee collected at application; refunded same day if not drawn
  '',
  '',
  '',
  'Jun 2026',
  s.status,
  s.note
FROM nm_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'New Mexico produces world-class bull elk. The Gila, Valles Caldera, and southeast NM ranches are legendary. Non-resident tag ~$773. Pure random draw — apply every year, even for premium early-season archery hunts. Outfitter quota (10%) is separate from the non-resident DIY pool (6%).'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'New Mexico mule deer hunting is excellent, especially in the northwest and southwest regions. Large bucks are taken from the San Juan Basin and Guadalupe units. Non-resident tag ~$368. Same random draw as elk — no points required.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'New Mexico consistently produces Boone & Crockett pronghorn bucks. The northeast and northwest plains units are top producers. Non-resident tag ~$283. Pure random draw — good odds for first-time applicants.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'NM offers both Rocky Mountain and Desert bighorn tags. Tags are extremely limited — apply every year and consider it a long-term goal. Both subspecies are available in limited GMUs. One of the most coveted big game tags in the Southwest.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Jan 15, 2026', 'Feb 11, 2026', 'Feb 18, 2026', 'closed', 'Spring bear controlled hunts had a February 11, 2026 deadline. Fall bear hunts may be draw or OTC depending on unit — check the NMDGF regulations for unit-specific requirements.'),
  ('oryx',          ARRAY['rifle']::text[],                          'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'One of the most unique hunts in North America — oryx (gemsbok) on and around White Sands Missile Range. Tags are very limited (a few hundred annually). Both resident and non-resident may apply. Hunts are conducted in a remote desert environment with guided access to WSMR. Absolutely bucket-list material.'),
  ('ibex',          ARRAY['rifle']::text[],                          'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'Ibex are found only in the Florida Mountains near Deming (Doña Ana County). Tag numbers are very limited. Challenging mountain terrain — one of the rarest big game tags in the US. Apply every year; pure random draw means anyone can draw in any year.'),
  ('javelina',      ARRAY['archery','rifle']::text[],                'Jan 15, 2026', 'Mar 18, 2026', 'Apr 22, 2026', 'open',   'Javelina (collared peccary) hunts are draw-only in New Mexico. Found primarily in the southern regions of the state near the Chihuahuan Desert. A fun, affordable NM draw — tag fees are lower than big game species.')
) AS s(species, seasons, open_date, deadline, results_date, status, note);
