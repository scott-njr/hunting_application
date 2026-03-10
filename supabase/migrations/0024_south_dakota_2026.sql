-- South Dakota 2026 big game draw data
-- IMPORTANT: Non-residents CANNOT apply for elk, bighorn sheep, or mountain goat in SD
-- Non-residents eligible: deer (archery + firearm), pronghorn (archery + firearm), bison
-- No application fee for most SD draws; credit card charged only if drawn
-- Preference point system (not squared); points affect first drawing tier only
-- Source: https://gfp.sd.gov / https://license.gooutdoorssouthdakota.com

WITH sd_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'South Dakota',
    'SD',
    2026,
    'https://license.gooutdoorssouthdakota.com',
    'South Dakota does not use a traditional GMU system for most species. Deer and antelope applications are organized by county or unit within regions (Black Hills, Custer State Park, Black Hills NF, and various plains units). Elk hunting is concentrated in the Black Hills region and a few additional areas with established herds. The Black Hills of western SD is the center of most big game activity. Access maps and unit boundaries are available in the annual hunting regulations at gfp.sd.gov.',
    'NON-RESIDENTS: You CANNOT apply for elk, bighorn sheep, or mountain goat in South Dakota — these are restricted to residents only. Non-residents can apply for deer (archery and firearm), pronghorn/antelope (archery and firearm), and bison. South Dakota has NO application fee for most draws — you only pay for your license if drawn. Pronghorn tags are very attainable compared to other western states.',
    '[
      {"step":1,"label":"Create a Go Outdoors SD account","detail":"All South Dakota hunting license and draw applications are handled through the Go Outdoors South Dakota portal (license.gooutdoorssouthdakota.com). Create a user profile if you don''t already have one. Your account tracks your preference points.","link":{"label":"Go Outdoors SD","url":"https://license.gooutdoorssouthdakota.com"}},
      {"step":2,"label":"Check non-resident eligibility","detail":"Non-residents may apply for deer (archery and firearm), pronghorn antelope (archery and firearm), and bison. Non-residents CANNOT apply for elk, bighorn sheep, or mountain goat — these are resident-only species. Confirm your residency status before applying.","warning":true},
      {"step":3,"label":"No application fee — credit card charged only if drawn","detail":"South Dakota does not charge an application fee for most draw species. Submit your application with a valid credit card on file. You will only be charged when draw results are announced and if you are selected. This makes SD a low-risk state to apply in every year."},
      {"step":4,"label":"Understand the preference point system","detail":"South Dakota uses a preference point system. Applicants with the maximum points for a species are drawn first (first drawing tier). Points are species-specific and earned each year you apply but are not drawn. Once drawn, your points reset. Maximum 1 point per year per species."},
      {"step":5,"label":"Archery seasons: apply by late April","detail":"Archery deer applications close approximately April 22, 2026. Archery antelope applications close approximately April 23, 2026. Apply early through the Go Outdoors SD portal."},
      {"step":6,"label":"Firearm seasons: apply by late August","detail":"Firearm deer and antelope applications close in late August (exact date TBD — check gfp.sd.gov). Firearm applications are separate from archery; apply for both if interested in either season type."},
      {"step":7,"label":"Results posted in summer","detail":"Draw results for archery deer and antelope are typically posted in May–June. Firearm results are posted in September. Check your Go Outdoors SD account or the GFP website for your draw status.","link":{"label":"Draw Statistics","url":"https://gfp.sd.gov/draw-stats/"}}
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
  sd_state.id,
  'SD',
  2026,
  s.species,
  s.seasons,
  s.open_date,
  s.deadline,
  s.results_date,
  s.results_date,
  '',
  '',
  '',
  '',
  s.status,
  s.note
FROM sd_state,
(VALUES
  ('pronghorn',     ARRAY['archery','rifle']::text[],  'Feb 1, 2026', 'Apr 23, 2026', 'May 2026',   'open',     'OPEN TO NON-RESIDENTS. South Dakota has one of the highest pronghorn populations in North America — the open prairies of western SD are excellent antelope habitat. Archery applications close April 23. Firearm antelope applications close in late August (separate application). No application fee — pay only if drawn. Good draw odds compared to other western states.'),
  ('whitetail',     ARRAY['archery','rifle']::text[],  'Feb 1, 2026', 'Apr 22, 2026', 'May 2026',   'open',     'OPEN TO NON-RESIDENTS. South Dakota produces big whitetail bucks, especially in the agricultural river bottoms of eastern SD and the Black Hills fringes. Archery deer applications close April 22. Firearm deer applications close in late August (separate). Limited-entry units in top areas. Point system applies — apply every year.'),
  ('mule_deer',     ARRAY['archery','rifle']::text[],  'Feb 1, 2026', 'Apr 22, 2026', 'May 2026',   'open',     'OPEN TO NON-RESIDENTS. Mule deer in western South Dakota — Black Hills and Badlands areas. Draw-required for most quality units. The Badlands and adjacent mixed-grass prairie produce good mule deer bucks. Archery applications April 22, firearm applications late August.'),
  ('elk',           ARRAY['archery','rifle']::text[],  'Feb 1, 2026', 'May 31, 2026', 'Jun 2026',   'open',     'RESIDENTS ONLY — non-residents may not apply for SD elk. Black Hills elk hunting is concentrated in the Custer State Park, Black Hills National Forest, and Wind Cave National Park units. Tag numbers are limited. Points required for consistent success in top Black Hills units.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],             'Feb 1, 2026', 'May 31, 2026', 'Jun 2026',   'upcoming', 'RESIDENTS ONLY — non-residents may not apply for SD bighorn sheep. Rocky Mountain bighorn in the Black Hills. Extremely limited tags — apply every eligible year. Bighorn sheep and mountain goat are considered lifetime achievement tags in South Dakota.'),
  ('bison',         ARRAY['rifle']::text[],             'Feb 1, 2026', 'May 31, 2026', 'Jun 2026',   'upcoming', 'OPEN TO NON-RESIDENTS. Custer State Park offers one of the few publicly accessible bison hunts in the country. A limited number of bison tags are issued annually via draw. Tags are very limited and heavily sought after — a bucket-list opportunity. Check specific eligibility and season dates on the GFP website.')
) AS s(species, seasons, open_date, deadline, results_date, status, note);
