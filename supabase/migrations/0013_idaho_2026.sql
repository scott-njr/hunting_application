-- Idaho 2026 controlled hunt draw data
-- Application window: approximately Jan 1 – Feb 5, 2026 (CLOSED as of Mar 2026)
-- $5.50 non-refundable application fee per species
-- Preference point system — points accumulate per species per year
-- Note: much of Idaho deer and elk hunting is OTC general season; draw is for controlled (limited) hunts
-- Source: https://idfg.idaho.gov/hunt/draw
-- TODO: verify exact 2026 deadline and results dates (deadline historically ~Feb 5, results ~Apr 15)

WITH id_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Idaho',
    'ID',
    2026,
    'https://idfg.idaho.gov/hunt/draw',
    'Idaho uses hunting zones and unit numbers. Many deer and elk tags are available OTC (general season) — the draw only applies to controlled hunts in specific units with limited tags. Check the IDFG Hunt Planner to determine whether your target unit requires a controlled hunt tag.',
    'Much of Idaho''s deer and elk hunting does not require a draw — general season tags are available OTC. The draw is for controlled hunts in specific high-demand units. If you don''t draw a controlled tag, you may still hunt general season in many areas with an OTC license.',
    '[
      {"step":1,"label":"Purchase an Idaho hunting license","detail":"You must hold a valid Idaho hunting license before applying for controlled hunts. Residents and nonresidents can purchase online or at a license vendor.","link":{"label":"IDFG License Purchase","url":"https://idfg.idaho.gov/buy"}},
      {"step":2,"label":"Create or log in to your IDFG account","detail":"Controlled hunt applications are submitted through the IDFG online licensing system. Create a free account using your customer ID if you don''t have one.","link":{"label":"IDFG Hunt Draw Portal","url":"https://idfg.idaho.gov/hunt/draw"}},
      {"step":3,"label":"Check whether your target unit is controlled or OTC","detail":"Use the IDFG Hunt Planner to determine if your target area requires a controlled hunt permit. Many prime units are OTC — you may not need to apply at all.","link":{"label":"IDFG Hunt Planner","url":"https://idfg.idaho.gov/hunt/planner"}},
      {"step":4,"label":"Pay the $5.50 non-refundable application fee","detail":"Idaho charges a $5.50 application fee per controlled hunt application. This fee is non-refundable. You may apply for multiple controlled hunts across different species.","warning":true},
      {"step":5,"label":"Submit by the early February deadline","detail":"The controlled hunt application window typically opens January 1 and closes in early February. Submit early — the system can be slow near the deadline."},
      {"step":6,"label":"Preference points accumulate each year you don''t draw","detail":"Idaho uses a preference point system for controlled hunts. Each year you apply and are not drawn, you earn one preference point per species. Points increase your priority in future draws."},
      {"step":7,"label":"Results posted in April — check your IDFG account","detail":"Draw results are posted in your IDFG online account in April. If drawn, your tag is available for purchase. You will receive an email notification when results are posted."}
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
  id_state.id,
  'ID',
  2026,
  s.species,
  s.seasons,
  'Jan 1, 2026',
  'Feb 5, 2026',   -- TODO: verify exact 2026 deadline
  'Apr 15, 2026',  -- TODO: verify
  'May 1, 2026',   -- TODO: verify
  '',
  '',
  '',
  '',
  'closed',
  s.note
FROM id_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Many Idaho elk units are OTC general season — controlled hunt draw is only required for premium limited units. Check the IDFG Hunt Planner for your target area before applying.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Most Idaho mule deer hunting is OTC general season. Controlled hunts exist in select units with exceptional buck potential. Verify your target unit before applying.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Most pronghorn tags in Idaho require a controlled hunt draw. Tags are relatively attainable in many units, especially compared to neighboring states.'),
  ('moose',         ARRAY['rifle']::text[],                          'Very limited controlled hunt tags. Expect significant preference point accumulation for most units. Plan as a long-term, high-priority application.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Extremely limited permits. Most units require 10–20+ preference points. One of the most coveted tags in the West.'),
  ('mountain_goat', ARRAY['rifle']::text[],                          'Very limited statewide. Expect many years of preference point accumulation. Excellent success rates once drawn.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Many Idaho bear tags are OTC. Controlled hunts exist in specific units during spring and fall seasons. Spring baiting is legal in Idaho — check regulations for your unit.')
) AS s(species, seasons, note);
