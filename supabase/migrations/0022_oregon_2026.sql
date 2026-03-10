-- Oregon 2026 controlled hunt draw data
-- Spring bear: application closed Feb 10, results Feb 20 (CLOSED)
-- All other big game: application OPEN now, closes May 15, 2026; results Jun 12
-- Preference point system: 75% of tags go to top-point holders, 25% random draw
-- Oregon hunting license required to apply (resident $39, non-resident $193)
-- Application fee: $10/application (non-refundable)
-- Source: https://myodfw.com/articles/controlled-hunt-navigation

WITH or_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Oregon',
    'OR',
    2026,
    'https://myodfw.com/hunting',
    'Oregon uses Hunt Units for deer and elk (similar to GMUs), and zones for pronghorn and other species. Units are grouped into western and eastern Oregon — vastly different terrain and species. Eastern Oregon (Zumwalt Prairie, Hells Canyon, Blue Mountains) is prime elk and mule deer country. Western Oregon produces Roosevelt elk and blacktail deer. The ODFW publishes annual Controlled Hunt Statistics showing draw odds by hunt code — essential reading before applying.',
    'Oregon''s preference point system awards 75% of tags to applicants with the highest point total for each hunt code, with the remaining 25% issued by random draw. Maximum 2026 points are 33 for deer and antelope, 32 for elk. This means it is still possible to draw any tag in the 25% random pool — but top units require many accumulated points for guaranteed access to the 75% pool.',
    '[
      {"step":1,"label":"Purchase an Oregon hunting license","detail":"A valid Oregon hunting license is required before submitting a controlled hunt application. Resident: $39 / Non-resident: $193. Purchase through the ODFW online licensing portal or at a license sales agent.","link":{"label":"ODFW Licensing","url":"https://myodfw.com/hunting"}},
      {"step":2,"label":"Create or log in to your MyODFW account","detail":"All controlled hunt applications are submitted online at myodfw.com. Create an account with your name, date of birth, contact info, and hunter education number. This account tracks your preference points — keep it active every year.","link":{"label":"MyODFW","url":"https://myodfw.com"}},
      {"step":3,"label":"Review draw odds and choose hunt codes","detail":"ODFW publishes draw statistics showing how many points were needed in prior years for each hunt code. Research unit harvest reports and access information. You can apply for multiple hunt codes per species — rank your choices carefully.","link":{"label":"Controlled Hunt Stats","url":"https://odfw.huntfishoregon.com/reportdownloads"}},
      {"step":4,"label":"Pay the $10 non-refundable application fee","detail":"Oregon charges $10 per controlled hunt application (includes $8 app fee + $2 license agent fee). This fee is non-refundable regardless of draw outcome. Tag fees are charged separately only if you are drawn.","warning":true},
      {"step":5,"label":"Submit by May 15, 2026","detail":"The application window is open now. The deadline for all big game controlled hunts (elk, deer, pronghorn, bighorn sheep, mountain goat) is May 15, 2026. Spring bear applications closed February 10. Submit early — no benefit to waiting until the deadline."},
      {"step":6,"label":"Understand the 75/25 point system","detail":"75% of each hunt''s tags go to applicants with the maximum preference points for that hunt code. The remaining 25% are issued by random draw open to all applicants. You earn 1 preference point for each year you apply for a hunt code and are unsuccessful in the 75% pool draw."},
      {"step":7,"label":"Results on June 12, 2026","detail":"Draw results are posted in your MyODFW account starting June 12. Results load by hunt series — if you want to see all results at once, wait until end of day June 12. If drawn, you''ll be notified and charged for your tag. Unsuccessful applicants earn preference points for their first-choice hunt.","link":{"label":"Check Results","url":"https://myodfw.com"}}
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
  or_state.id,
  'OR',
  2026,
  s.species,
  s.seasons,
  s.open_date,
  s.deadline,
  s.results_date,
  s.payment_deadline,
  '',
  '',
  '',
  '',
  s.status,
  s.note
FROM or_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Jan 1, 2026', 'May 15, 2026', 'Jun 12, 2026', 'Jun 30, 2026', 'open',   'Oregon offers both Rocky Mountain elk (eastern Oregon) and Roosevelt elk (western Oregon coast range). The Blue Mountains, Cascades, and Hells Canyon units produce consistently large bulls. Max elk preference points in 2026: 32. The 25% random pool gives every applicant a chance at any hunt.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Jan 1, 2026', 'May 15, 2026', 'Jun 12, 2026', 'Jun 30, 2026', 'open',   'Eastern Oregon''s mule deer hunting is excellent in the high desert and rimrock country. Hart Mountain, Steens Mountain, and the Owyhee breaks produce quality bucks. Max deer preference points in 2026: 33. Some western Oregon units offer blacktail deer controlled hunts.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Jan 1, 2026', 'May 15, 2026', 'Jun 12, 2026', 'Jun 30, 2026', 'open',   'Oregon pronghorn hunting is concentrated in the high desert of eastern Oregon — Hart Mountain NWR, Warner Valley, and adjacent BLM lands. Tags are limited. Max pronghorn preference points in 2026: 33. Archery hunts are available with slightly better odds in some units.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Jan 1, 2026', 'May 15, 2026', 'Jun 12, 2026', 'Jun 30, 2026', 'open',   'Oregon offers both Rocky Mountain and California bighorn sheep hunts. Units in the Hells Canyon and Owyhee canyon country are among the best in the Northwest. Tags are extremely limited — plan for many years of point accumulation for top units.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Jan 1, 2026', 'May 15, 2026', 'Jun 12, 2026', 'Jun 30, 2026', 'open',   'Oregon mountain goat tags are among the hardest to draw in the state — only a handful issued per year in the Wallowa Mountains and Cascade Range. Consider it a long-term application goal and enjoy the scenery while points accumulate.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Jan 1, 2026', 'Feb 10, 2026', 'Feb 20, 2026', 'Mar 1, 2026',  'closed', 'Spring black bear controlled hunt applications closed February 10, 2026. Fall bear hunting in Oregon has both general season and controlled hunt components depending on the unit. Check the ODFW big game regulations for fall controlled bear hunt application dates (separate window from spring).')
) AS s(species, seasons, open_date, deadline, results_date, payment_deadline, status, note);
