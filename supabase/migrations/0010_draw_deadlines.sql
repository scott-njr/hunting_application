-- Draw deadline data — replaces hardcoded DRAWS array in the deadlines page
-- Two tables: draw_states (state-level shared data) + draw_species (per-species cards)
-- RLS: authenticated SELECT only; no client writes — admin-managed via migrations
-- Seeded with Colorado 2026 big game draw data

-- ─── draw_states ──────────────────────────────────────────────────────────────
-- One row per (state_code, year). Shared metadata: portal, GMU notes, warning, requirements checklist.

CREATE TABLE IF NOT EXISTS public.draw_states (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  state_name          TEXT        NOT NULL,
  state_code          CHAR(2)     NOT NULL,
  year                INTEGER     NOT NULL,
  portal_url          TEXT,
  gmu_notes           TEXT,
  state_warning       TEXT,
  shared_requirements JSONB       NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (state_code, year)
);

ALTER TABLE public.draw_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view draw states"
  ON public.draw_states FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── draw_species ─────────────────────────────────────────────────────────────
-- One row per (state_code, species, year) = one display card.
-- CO: 8 rows sharing same deadline dates. WY (future): rows with different dates per species.

CREATE TABLE IF NOT EXISTS public.draw_species (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_state_id        UUID        NOT NULL REFERENCES public.draw_states(id) ON DELETE CASCADE,
  state_code           CHAR(2)     NOT NULL,
  year                 INTEGER     NOT NULL,
  species              TEXT        NOT NULL,
  seasons              TEXT[]      NOT NULL DEFAULT '{}',
  open_date            TEXT,
  deadline             TEXT,
  results_date         TEXT,
  payment_deadline     TEXT,
  secondary_open       TEXT,
  secondary_close      TEXT,
  secondary_results    TEXT,
  leftover_date        TEXT,
  status               TEXT        NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('open', 'upcoming', 'closed')),
  note                 TEXT,
  species_requirements JSONB       NOT NULL DEFAULT '[]',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (state_code, species, year)
);

ALTER TABLE public.draw_species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view draw species"
  ON public.draw_species FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── Seed: Colorado 2026 ──────────────────────────────────────────────────────

WITH co_state AS (
  INSERT INTO public.draw_states (
    state_name,
    state_code,
    year,
    portal_url,
    gmu_notes,
    state_warning,
    shared_requirements
  ) VALUES (
    'Colorado',
    'CO',
    2026,
    'https://cpwshop.com',
    'Colorado uses Game Management Units (GMUs). You can apply for a specific GMU or leave it open. Check the CPW brochure for unit quotas and point creep before choosing.',
    'Colorado shifts to a bonus+preference hybrid system in 2028. Hunters with 5+ points should review their strategy now — this changes draw odds significantly.',
    '[
      {"step":1,"label":"Get a Colorado license or habitat stamp","detail":"You need a valid Colorado hunting license (or at minimum a habitat stamp) before you can submit a draw application. Purchase through CPW Shop.","link":{"label":"CPW Shop","url":"https://cpwshop.com"}},
      {"step":2,"label":"Create or log in to your CPW Shop account","detail":"All Colorado draw applications are submitted through the CPW online portal. Create an account if you don''t have one."},
      {"step":3,"label":"Review the current draw brochure","detail":"Check unit quotas, license numbers, and point requirements. The brochure is published ~Feb each year at cpw.state.co.us.","link":{"label":"CPW Draw Brochure","url":"https://cpw.state.co.us/hunting/pages/drawhunting.aspx"}},
      {"step":4,"label":"Submit your draw application (up to 4 choices per species)","detail":"Select your species, season, GMU, and license type. You can submit up to 4 unit choices per species. Application fee is charged at time of submission."},
      {"step":5,"label":"Application fee is non-refundable","detail":"The application fee is charged when you apply, regardless of whether you draw. Tag fees are only charged if you are successful.","warning":true},
      {"step":6,"label":"Wait for results (May 26–29)","detail":"Results are posted in your CPW account. Successful applicants are charged for their tag automatically."},
      {"step":7,"label":"Secondary draw (Jun 19–30) for unsuccessful applicants","detail":"If you didn''t draw in the primary, you can apply for leftover tags in the secondary draw. Points are NOT used in the secondary draw — it''s first-come, first-served for leftover licenses."},
      {"step":8,"label":"Leftover OTC tags go on sale in early August","detail":"Any remaining tags after the secondary draw are sold over-the-counter. Popular units sell out fast."}
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
  co_state.id,
  'CO',
  2026,
  s.species,
  s.seasons,
  'Mar 1, 2026',
  'Apr 7, 2026',
  'May 26, 2026',
  'Jun 12, 2026',
  'Jun 19, 2026',
  'Jun 30, 2026',
  'Jul 7, 2026',
  'Early Aug 2026',
  'open',
  s.note
FROM co_state,
(VALUES
  ('elk',           ARRAY['archery','rifle','muzzleloader']::text[], '2026: Nonresident archery elk west of I-25 now requires a draw — no more OTC.'),
  ('mule_deer',     ARRAY['archery','rifle','muzzleloader']::text[], NULL::text),
  ('whitetail',     ARRAY['archery','rifle','muzzleloader']::text[], NULL::text),
  ('pronghorn',     ARRAY['archery','rifle','muzzleloader']::text[], NULL::text),
  ('black_bear',    ARRAY['archery','rifle','muzzleloader']::text[], NULL::text),
  ('bighorn_sheep', ARRAY['rifle']::text[],                          NULL::text),
  ('mountain_goat', ARRAY['rifle']::text[],                          NULL::text),
  ('moose',         ARRAY['rifle']::text[],                          NULL::text)
) AS s(species, seasons, note);
