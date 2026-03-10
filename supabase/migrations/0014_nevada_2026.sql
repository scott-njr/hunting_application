-- Nevada 2026 big game draw data
-- Application window: approximately Feb 1 – Mar 31, 2026 (OPEN as of Mar 2026)
-- Nevada uses a straight random draw — NO preference or bonus points
-- Application fee: ~$8 per species (non-refundable); tag fee charged only if drawn
-- All tags are draw-only; Nevada has no OTC big game tags
-- Source: https://www.ndow.org/hunt/apply/
-- TODO: verify exact 2026 deadline (historically late March) and fee amounts

WITH nv_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Nevada',
    'NV',
    2026,
    'https://www.ndow.org/hunt/apply/',
    'Nevada uses Wildlife Management Units (WMUs) numbered by region. All big game tags require a draw — there are no OTC tags. Tag quotas are very limited statewide, particularly for mule deer, elk, and sheep. Research harvest statistics and success rates by unit before applying.',
    'Nevada uses a straight random draw with NO preference or bonus points. Every applicant has the same odds regardless of how many years they have applied. This means you can draw on your first try — or never draw. Apply every year to maximize your lifetime chances.',
    '[
      {"step":1,"label":"No hunting license required to apply","detail":"Unlike most states, Nevada does not require you to hold a hunting license to submit a draw application. You only need to purchase a license if you are drawn. This makes Nevada a low-risk, low-cost application."},
      {"step":2,"label":"Create or log in to your NDOW account","detail":"All applications are submitted through the Nevada Department of Wildlife online portal. Create a free account with your name, date of birth, and contact information.","link":{"label":"NDOW Hunt Application Portal","url":"https://www.ndow.org/hunt/apply/"}},
      {"step":3,"label":"Research WMUs and success rates","detail":"Nevada publishes harvest reports and draw statistics by unit. Review these carefully — some units have extremely low odds (bighorn sheep can be 1 in several hundred applicants), while others offer better chances for mule deer.","link":{"label":"NDOW Hunt Statistics","url":"https://www.ndow.org/hunt/statistics/"}},
      {"step":4,"label":"Pay the application fee per species","detail":"Nevada charges a small application fee per species (approximately $8 — verify current amount). This fee is non-refundable. If drawn, you will be billed for the full tag price separately.","warning":true},
      {"step":5,"label":"Submit before the late March deadline","detail":"The application window typically opens February 1 and closes in late March. You may apply for multiple species in the same submission."},
      {"step":6,"label":"No points system — pure random draw","detail":"Nevada does not use preference or bonus points. Every applicant has an equal chance each year. Applying for multiple years does not improve your odds for any individual year — just your cumulative lifetime chances."},
      {"step":7,"label":"Check results in May/June","detail":"Draw results are posted in your NDOW account in May or June. If drawn, you will receive a notification and tag purchasing instructions. Non-drawn applicants receive their application fee back (tag fee only — the application fee is retained)."}
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
  nv_state.id,
  'NV',
  2026,
  s.species,
  s.seasons,
  'Feb 1, 2026',
  'Mar 31, 2026',  -- TODO: verify exact 2026 deadline
  'Jun 2026',      -- TODO: verify
  'Jun 2026',
  '',
  '',
  '',
  '',
  'open',          -- window open as of Mar 2026
  s.note
FROM nv_state,
(VALUES
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Nevada mule deer tags are among the most coveted in the West. Odds vary widely by unit — some early season archery units offer better odds, while late rifle seasons in trophy units can be 1 in 100 or worse. No points system means apply every year.'),
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Nevada elk tags are extremely limited. Some units have exceptional bull quality. Odds are generally low — many applicants apply for years without drawing. All elk is draw-only.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Nevada pronghorn offers some of the best trophy quality in the country. Tags are limited but odds are generally better than elk or deer for most units. Worth applying every year.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Desert bighorn and Rocky Mountain bighorn both available in select Nevada units. Odds are extremely low — often 1–2% statewide. No points to accumulate so every year is an independent chance.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Very limited permits. Nevada mountain goat hunts are rare opportunities in dramatic terrain. Apply every year — pure luck determines who draws.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Nevada black bear populations are limited. Tags are very restricted and draw odds are low. Most hunting occurs in the northern mountain ranges.')
) AS s(species, seasons, note);
