---
name: gen-course
description: Generate a structured curriculum outline for a new course article. Use when creating course content.
argument-hint: "<module> \"<topic>\""
---

Generate a structured curriculum outline for a new course article.

Arguments: $ARGUMENTS
(Expected format: MODULE "TOPIC" — e.g., `hunting "Hunter Safety and Ethics"` or `fishing "How to Choose a Fly Rod"`)

## Your Task

Parse the module and topic from the arguments. Web-search for real educational content on the topic to build a structured outline. Do NOT write the full article — produce an outline the user reviews before generating the final content.

## Steps

### 1. Parse Arguments
- Extract module (first word): hunting, fishing, spearfishing, firearms, fitness, mindset
- Extract topic (quoted string): the article title

### 2. Determine Sort Order
Read `supabase/migrations/` to find the highest `sort_order` currently used in the courses table. Your new article should use the next value.

### 3. Research the Topic
Perform 3-5 web searches to gather real, current information. **Always use the current year (2026) in searches** — never use prior years. Regulations, costs, and requirements change annually.
- Search: `"[topic] guide for beginners 2026"`
- Search: `"[topic] tips [module] 2026"`
- Search: `"[topic] common mistakes"`
- Search: `"[topic] regulations 2026 [state]"` (if applicable — CO, MT, WY, ID, NV, UT, AZ)
- Search: `"[topic] expert advice 2026"`

Collect key facts, statistics, real-world examples, and authoritative sources (state wildlife agencies, outdoor education orgs, manufacturer guides). For any regulation, cost, or requirement data, only use 2026 sources. If 2026 data is not available, mark it `[VERIFY — source is from [year]]`.

### 4. Generate the Outline

## Output Format

```
## Course Outline: [Title]

### Metadata
- **Module:** [module]
- **Suggested Category:** [kebab-case — e.g., regulations-safety, draw-strategy, field-skills, gear-selection, species-guide, land-navigation]
- **Suggested Tier:** basic | pro (basic = foundational knowledge; pro = advanced strategy)
- **Suggested Slug:** [kebab-case-slug]
- **Estimated Read Time:** [X] minutes
- **Content Type:** article
- **Sort Order:** [next available number]

### Outline

#### Section 1: [Section Title]
- Key point 1
- Key point 2
- Key point 3

#### Section 2: [Section Title]
- Key point 1
- Key point 2
- Key point 3

(Continue for 4-8 sections depending on topic depth)

### Tone & Style Notes
- Praevius Scout voice: practical, conversational, written for hunters not academics
- Second-person ("you", "your")
- Include real data/statistics where available
- Reference specific states/regulations where applicable
- Include actionable takeaways, not just theory
- End with a "Next Steps" or action items section

### Sources Found
1. [Source title] — [URL] — [What it covers]
2. [Source title] — [URL] — [What it covers]
...

### SQL INSERT Template (use after article body is written)

INSERT INTO public.courses (
  module, content_type, title, slug, description, body,
  duration_minutes, tier_required, category, sort_order,
  published, published_at
) VALUES (
  '[module]', 'article',
  '[Title]',
  '[slug]',
  '[1-2 sentence description]',
  E'[BODY — replace with full markdown article]',
  [estimated_minutes], '[basic|pro]', '[category]', [sort_order],
  true, NOW()
);
```

## Rules
- Never generate the full article body — outline only
- Always web-search; do not rely solely on training data
- Mark any uncertain data with `[VERIFY]`
- Category suggestions should be meaningful kebab-case groupings
- If module is not "hunting", still provide the outline but note the module is not yet active
- Slug must be unique — check existing migrations for collisions
- Description should be 1-2 sentences, compelling, and specific
- Tier suggestion: basic for foundational/essential knowledge, pro for advanced strategy or niche topics
