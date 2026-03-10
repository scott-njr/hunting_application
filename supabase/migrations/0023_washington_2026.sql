-- Washington State 2026 special permit draw data
-- Multi-season deer/elk: Dec 1, 2025 – Mar 31, 2026 (OPEN — 26 days left as of Mar 5)
-- Special permits (goat, sheep, moose, turkey): deadline May 22, 2026
-- Squared bonus point system — points are squared for draw entries
-- Washington hunting license required before applying
-- Special permit application fee: ~$110.50 (includes tag fee, charged at application)
-- Source: https://wdfw.wa.gov/hunting/special-hunts

WITH wa_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Washington',
    'WA',
    2026,
    'https://licensing.dfw.wa.gov',
    'Washington uses Wildlife Management Units (WMUs), numbered with a 3-digit system (e.g., WMU 101, WMU 485). There are approximately 55+ WMUs grouped into 6 WDFW regional offices. Special permits are issued per specific WMU. Use the WDFW Hunt Planner interactive map to explore units, boundaries, and historical harvest data. Multi-season deer and elk tags are drawn by WMU; special permits for goat, sheep, and moose are also drawn.',
    'Washington uses a SQUARED BONUS POINT system — your points are squared to determine draw entries. With 5 points you get 25 entries; with 10 points you get 100 entries. This makes long-term applicants much more likely to draw than newcomers for premium tags. Special permit application fees (~$110.50) are charged upfront at time of application, not post-draw. A Washington hunting license must be purchased before applying.',
    '[
      {"step":1,"label":"Purchase a Washington hunting license","detail":"A valid Washington hunting license is required before submitting a special permit application. Purchase through the WILD licensing portal (licensing.dfw.wa.gov) or from an authorized license dealer. License must be active before applying.","link":{"label":"WILD Licensing Portal","url":"https://licensing.dfw.wa.gov"}},
      {"step":2,"label":"Create or log in to your WILD account","detail":"All Washington special permit applications are managed through the WILD (Washington Interactive Licensing Database) system. Create an account at licensing.dfw.wa.gov. This account tracks your preference/bonus points — keep it active.","link":{"label":"WILD Portal","url":"https://licensing.dfw.wa.gov"}},
      {"step":3,"label":"Use the Hunt Planner to research WMUs","detail":"The WDFW Hunt Planner tool shows WMU boundaries, permit quotas, and historical draw results. Research which WMUs align with your target species, hunting style, and access preferences before submitting.","link":{"label":"Hunt Planner","url":"https://fortress.wa.gov/dfw/huntingapp/"}},
      {"step":4,"label":"Application fee charged upfront at submission","detail":"Washington charges the special permit application fee (~$110.50) at time of application — not post-draw. This includes the tag fee for most categories. Review fees carefully in your WILD cart before submitting. Fees increased July 1, 2025; verify current amounts at licensing.dfw.wa.gov.","warning":true},
      {"step":5,"label":"Multi-season deer/elk: apply by March 31, 2026","detail":"The 2026 multi-season deer and elk special tag application window is open through March 31, 2026. Apply online through the WILD portal or at an authorized dealer. Drawing results are posted in your WILD account in April."},
      {"step":6,"label":"Special permits (goat, sheep, moose, turkey): apply by May 22","detail":"Applications for mountain goat, bighorn sheep, moose, and wild turkey special permits are open through May 22, 2026. Results for these categories are available by end of June, with written notification in July."},
      {"step":7,"label":"Squared bonus points — apply every year","detail":"Washington''s squared point system creates exponential advantages for long-term applicants. Even for species where you don''t expect to draw, purchase a point-only application each year. A hunter with 8 points has 64 entries vs. 1 for a first-year applicant. Never skip a year."},
      {"step":8,"label":"Check results in your WILD account","detail":"Multi-season draw results post in April. Special permit results post by end of June, with mail/email notification by mid-July. Log into your WILD account at licensing.dfw.wa.gov to view results.","link":{"label":"Check Results","url":"https://licensing.dfw.wa.gov"}}
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
  wa_state.id,
  'WA',
  2026,
  s.species,
  s.seasons,
  s.open_date,
  s.deadline,
  s.results_date,
  s.results_date,   -- fees charged at application in Washington
  '',
  '',
  '',
  '',
  s.status,
  s.note
FROM wa_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Dec 1, 2025', 'Mar 31, 2026', 'Apr 2026',     'open',   'Washington has both Rocky Mountain elk (eastern WA) and Roosevelt elk (western WA). The Blue Mountains and Selkirk range produce exceptional bulls. Multi-season tags offer extended seasons with higher success rates. Points system favors applicants who have applied consistently over many years.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Dec 1, 2025', 'Mar 31, 2026', 'Apr 2026',     'open',   'Eastern Washington mule deer country is excellent — the Okanogan Highlands and Columbia Basin produce quality bucks. Multi-season mule deer tags provide access to combined archery/rifle seasons. Squared bonus points mean early applicants build a large lead over time.'),
  ('whitetail',     ARRAY['archery','rifle','muzzleloader']::text[], 'Dec 1, 2025', 'Mar 31, 2026', 'Apr 2026',     'open',   'Northeast Washington (Pend Oreille and Stevens counties) is top whitetail country. Special permit units exist in multiple WMUs. Multi-season whitetail tags are highly sought after. The Selkirk range holds good genetics — big northern-strain bucks are common.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Jan 1, 2026', 'May 22, 2026', 'Late Jun 2026', 'open',   'Washington''s Rocky Mountain bighorn permits are among the most limited special permits in the state — only a handful issued annually in the Hells Canyon and Methow Valley units. Squared points system makes persistence critical. Consider this a once-in-a-lifetime goal and apply every year without exception.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Jan 1, 2026', 'May 22, 2026', 'Late Jun 2026', 'open',   'Mountain goat permits are issued in the Cascades and a few other ranges. Tags are extremely limited. The North Cascades and Olympic Peninsula hold resident goat populations. Squared point system — apply every year for accumulating bonus point advantage.'),
  ('moose',         ARRAY['rifle']::text[],                          'Jan 1, 2026', 'May 22, 2026', 'Late Jun 2026', 'open',   'Washington moose are found in the northeast corner of the state (Pend Oreille and Ferry counties). Tags are very limited. Shiras moose are the subspecies present. The squared point system dramatically favors applicants with many years of prior applications.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Jan 1, 2026', 'May 22, 2026', 'Late Jun 2026', 'open',   'Pronghorn special permits are available in southeast Washington (Columbia Basin). Limited tags available each year. Washington pronghorn hunting is a unique opportunity in a state most hunters don''t associate with antelope. Early archery seasons can offer better odds than rifle in some units.')
) AS s(species, seasons, open_date, deadline, results_date, status, note);
