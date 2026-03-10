-- Arizona 2026 big game draw data
-- Application window: approximately Jan 1 – Feb 11, 2026 (CLOSED as of Mar 2026)
-- $13 non-refundable application fee per species
-- Bonus point system: points are squared (3 pts = 9 entries, 4 pts = 16 entries)
-- No hunting license required to apply — only needed if drawn
-- Source: https://www.azgfd.com/hunting/draw/
-- TODO: verify exact 2026 deadline (historically ~Feb 9–12) and results date (historically mid-May)

WITH az_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Arizona',
    'AZ',
    2026,
    'https://www.azgfd.com/hunting/draw/',
    'Arizona uses Game Management Units (GMUs) numbered 1–44. Research unit quality carefully — Arizona has some of the best trophy elk, mule deer, and Coues deer hunting in North America, but top units require many years of bonus points. The AZGFD publishes draw odds annually by unit and season.',
    'Arizona''s bonus point system squares your entries — 3 points gives you 9 entries, 4 points gives 16. This makes a huge difference for top tags: a hunter with 6 points (36 entries) has dramatically better odds than one with 3 points (9 entries). Apply every year even when you don''t expect to draw.',
    '[
      {"step":1,"label":"No hunting license required to apply","detail":"Arizona does not require a hunting license to submit a draw application. You only purchase a license if you are drawn. This makes AZ a low-barrier, low-cost state to apply in every year."},
      {"step":2,"label":"Create or log in to your AZGFD account","detail":"All applications are submitted through the Arizona Game and Fish Department online portal. Create a free account with your name, date of birth, and contact information.","link":{"label":"AZGFD Draw Portal","url":"https://www.azgfd.com/hunting/draw/"}},
      {"step":3,"label":"Review unit draw odds and choose wisely","detail":"Arizona publishes detailed draw statistics by unit and season. Top elk units (9, 10, 23) require 15+ bonus points. Research harvest data, point requirements, and success rates before finalizing your choices.","link":{"label":"AZGFD Draw Odds","url":"https://www.azgfd.com/hunting/draw/statistics/"}},
      {"step":4,"label":"Pay the $13 non-refundable application fee","detail":"Arizona charges $13 per species application fee at the time of submission. This fee is non-refundable regardless of draw outcome. If you don''t draw, you earn a bonus point for that species.","warning":true},
      {"step":5,"label":"Submit by the mid-February deadline","detail":"The application window opens January 1 and closes in mid-February (historically around February 9–12). Only one application per species is allowed per year."},
      {"step":6,"label":"Bonus points are squared — apply every year","detail":"Arizona squares your bonus points to determine draw entries. Each year you apply and don''t draw, you earn 1 point. With 5 points, you get 25 entries vs. 1 entry for a first-year applicant. The compounding effect is dramatic — never skip a year."},
      {"step":7,"label":"Results in May — check your AZGFD account","detail":"Draw results are typically posted in mid-May in your AZGFD online account. If drawn, you will be notified by email and charged for your tag. Bonus points are reset to zero for the species you drew."}
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
  az_state.id,
  'AZ',
  2026,
  s.species,
  s.seasons,
  'Jan 1, 2026',
  'Feb 11, 2026',  -- TODO: verify exact 2026 deadline
  'Mid-May 2026',  -- TODO: verify
  'Mid-May 2026',  -- tag charged at draw
  '',
  '',
  '',
  '',
  'closed',
  s.note
FROM az_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], 'Arizona is one of the premier elk states in North America. Top late rifle units (9, 10, 23) require 10–15+ bonus points but offer exceptional bull quality. Early archery tags are more attainable. Apply every year — the squared point system rewards consistency.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], 'Arizona produces giant desert mule deer. Top units in the Strip and Kaibab Plateau require significant points for late seasons. Archery and early rifle tags are more accessible. Also consider Coues deer — a unique Arizona experience.'),
  ('pronghorn',     ARRAY['archery','rifle']::text[],                'Arizona antelope tags are competitive, especially for late rifle seasons. Early archery seasons offer better odds. Arizona produces some of the largest pronghorn in the country on the Coconino Plateau.'),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          'Arizona desert bighorn is among the most prestigious tags in North America. Most units require 15–25+ bonus points. The squared point system makes persistence critical — apply every single year.'),
  ('black_bear',    ARRAY['archery','rifle']::text[],                'Arizona black bear tags are competitive in top mountain units. Spring bear hunting is legal in Arizona. The Mogollon Rim area produces quality bears. Tags are draw-only for most areas.'),
  ('bison',         ARRAY['rifle']::text[],                          'Limited bison permits available primarily in the House Rock Valley on the Kaibab Plateau. Extremely rare — one of the hardest tags to draw in Arizona. Plan as a decades-long application goal.')
) AS s(species, seasons, note);
