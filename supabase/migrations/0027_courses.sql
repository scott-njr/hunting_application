-- Courses content table + user progress tracking

-- Courses: admin-managed content (articles + videos)
CREATE TABLE IF NOT EXISTS public.courses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  module            TEXT        NOT NULL DEFAULT 'hunting',
  content_type      TEXT        NOT NULL CHECK (content_type IN ('article', 'video')),
  title             TEXT        NOT NULL,
  slug              TEXT        NOT NULL UNIQUE,
  description       TEXT,
  body              TEXT,
  video_url         TEXT,
  thumbnail_url     TEXT,
  duration_minutes  INTEGER,
  tier_required     TEXT        NOT NULL DEFAULT 'basic',
  category          TEXT,
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  published         BOOLEAN     NOT NULL DEFAULT false,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read published courses
CREATE POLICY "Authenticated users can read published courses"
  ON public.courses FOR SELECT
  USING (auth.uid() IS NOT NULL AND published = true);

CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Course progress: per-user completion tracking
CREATE TABLE IF NOT EXISTS public.course_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own course progress"
  ON public.course_progress
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER course_progress_updated_at
  BEFORE UPDATE ON public.course_progress
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Seed sample articles
INSERT INTO public.courses (module, content_type, title, slug, description, body, duration_minutes, tier_required, category, sort_order, published, published_at) VALUES
(
  'hunting', 'article',
  'Understanding Western Big Game Draws',
  'understanding-western-draws',
  'A complete beginner''s guide to how draw systems work across western states.',
  E'# Understanding Western Big Game Draws\n\nIf you''re new to western big game hunting, the draw system can feel overwhelming. Every state runs things a little differently, and the terminology alone — preference points, bonus points, weighted draws, squared bonus — can make your head spin.\n\nThis guide breaks it all down.\n\n## What Is a Draw?\n\nMost western states manage their big game hunting through a **limited entry draw system**. Instead of selling unlimited tags, the state sets a quota for each hunting unit and species, then holds a lottery. You apply, and if your name gets pulled, you get a tag.\n\n## Preference Points vs. Bonus Points\n\nThis is the single most important distinction in western hunting:\n\n### Preference Points (Colorado, Montana, Wyoming)\nPreference points create a **queue**. The applicant with the most points gets first priority. If you have 10 preference points and someone else has 9, you draw first. Period.\n\n- **Pro**: Predictable. You can calculate roughly when you''ll draw.\n- **Con**: Top units can take 20+ years of point building.\n\n### Bonus Points (Arizona, Nevada)\nBonus points improve your **odds** but don''t guarantee anything. Each bonus point gives you additional entries in the random draw. Someone with 0 points can still draw over someone with 15.\n\n- **Pro**: There''s always a chance, even for newcomers.\n- **Con**: Less predictable. You might never draw a top unit.\n\n## State-by-State Overview\n\n| State | System | Application Period | Cost |\n|-------|--------|-------------------|------|\n| Colorado | Preference | March-April | $40-100 |\n| Montana | Preference + Bonus hybrid | March | $50-125 |\n| Wyoming | Preference (75%) + Random (25%) | January | $50-150 |\n| Idaho | First-come or draw | December-February | $30-75 |\n| Nevada | Bonus (squared) | March-April | $15-150 |\n| Utah | Bonus | February | $10-65 |\n| Arizona | Bonus (squared) | February | $15-160 |\n\n## Your First Year Strategy\n\n1. **Start building points everywhere.** Even if you''re not ready to hunt, apply for preference/bonus points in every state you''re interested in. Time is your most valuable asset.\n2. **Pick one realistic hunt.** Choose an OTC (over-the-counter) tag or an easy-to-draw unit for your first hunt. Don''t blow points on a dream unit yet.\n3. **Learn the calendar.** Every state has different deadlines. Missing an application window means losing a year of point building.\n4. **Use the Deadline Tracker.** That''s literally why we built it.\n\n## Next Steps\n\nOnce you understand the basics, dive into unit selection strategy and learn how to evaluate draw odds for specific units.',
  12, 'basic', 'draw-strategy', 1, true, NOW()
),
(
  'hunting', 'article',
  'How Preference Points Actually Work',
  'how-preference-points-work',
  'Deep dive into preference point systems — how they accumulate, how ties break, and common mistakes.',
  E'# How Preference Points Actually Work\n\nYou''ve heard the advice: "Start building points." But what does that actually mean, and how do the mechanics work behind the scenes?\n\n## The Basics\n\nA preference point is earned each year you apply for a tag and **don''t draw**. Some states also let you buy a "point only" application — you''re not entering the draw, just banking a point for the future.\n\n## How Drawing Works\n\nWhen a state runs its draw, applicants are sorted into **pools** by point level. The highest point pool draws first. If there are more tags than applicants in that pool, everyone draws and leftover tags roll down to the next pool.\n\n### Example: Colorado Elk, Unit 61\n- 10 tags available\n- 8 applicants with 15 points\n- 25 applicants with 14 points\n\nAll 8 applicants with 15 points draw (8 tags gone). The remaining 2 tags go to the 14-point pool, where 2 of the 25 applicants are randomly selected.\n\n## Tiebreakers\n\nWhen multiple applicants have the same points, states use different tiebreaker methods:\n\n- **Colorado**: Random within the point pool\n- **Wyoming**: Random number assigned at application\n- **Montana**: Hybrid system with bonus points as tiebreaker\n\n## Common Mistakes\n\n### 1. Forgetting to Apply\nMiss one year and you lose your place in line. Set reminders. Use the deadline tracker.\n\n### 2. Applying for the Wrong Species\nPoints are species-specific in most states. Elk points don''t help you draw a deer tag.\n\n### 3. Not Understanding Group Applications\nWhen you apply as a group, the group''s draw priority is based on the **lowest** point holder. One friend with 0 points tanks your whole group.\n\n### 4. Burning Points on a Bad Year\nIf you have 12 elk points in Colorado, don''t put in for a unit that takes 15 to draw. You''ll burn your points and draw a unit you could have gotten with 5 points.\n\n## The Point Creep Problem\n\nEvery year, more people enter the system. Units that used to take 8 points now take 12. This "point creep" means waiting longer and longer. The solution? Start now. Every year you wait, the line gets longer.',
  8, 'basic', 'draw-strategy', 2, true, NOW()
),
(
  'hunting', 'article',
  'Advanced Unit Selection Strategy',
  'advanced-unit-selection',
  'How to evaluate units using draw odds, harvest data, access, and terrain to find your best opportunity.',
  E'# Advanced Unit Selection Strategy\n\nPicking the right unit is where strategy meets opportunity. This guide covers the analytical framework serious hunters use to evaluate units.\n\n## The Four Pillars of Unit Selection\n\n### 1. Draw Odds\nStart with the math. Look at:\n- **Historical draw odds** for your point level\n- **Point creep trends** — is the required points going up each year?\n- **Quota trends** — is the state increasing or decreasing tags?\n\n### 2. Harvest Statistics\nEvery state publishes harvest data. Key metrics:\n- **Hunter success rate** — what percentage of tag holders harvest an animal?\n- **Hunter density** — tags issued vs. square miles of huntable land\n- **Trophy quality** — average age class, antler/horn scores if that matters to you\n\n### 3. Access & Terrain\nA unit with great animals means nothing if you can''t get to them:\n- **Public vs. private land ratio** — more public = more access for everyone\n- **Road density** — more roads = easier access but more pressure\n- **Terrain difficulty** — steep wilderness units hold more animals but demand more fitness\n- **Trailhead proximity** — how far is the nearest access point from your camp?\n\n### 4. Season Timing\nDifferent seasons offer different experiences:\n- **Archery** — Early season, warm weather, animals in summer patterns. Lower success rates.\n- **Muzzleloader** — Transition period. Can be excellent timing.\n- **1st Rifle** — Peak rut for elk. Highest success rates. Most crowded.\n- **2nd/3rd/4th Rifle** — Post-rut, colder, animals may have been pressured.\n\n## Building Your Unit Shortlist\n\n1. Filter by draw-ability — only consider units you can realistically draw\n2. Rank by success rate — higher is better for first-timers\n3. Check access — verify public land availability on mapping tools\n4. Read hunt reports — forums, blogs, and community posts from people who''ve hunted there\n5. Scout digitally — use satellite imagery and topo maps to identify promising areas\n\n## The 80/20 Rule\n\n80% of hunters crowd into 20% of the accessible areas. If you''re willing to hike further, camp higher, and hunt harder, the odds shift dramatically in your favor.\n\n## When to Use AI\n\nThe AI Assistant can help you narrow down units based on your specific situation — your point levels, physical fitness, travel constraints, and goals. Feed it your parameters and let it crunch the data.',
  15, 'pro', 'draw-strategy', 3, true, NOW()
);
