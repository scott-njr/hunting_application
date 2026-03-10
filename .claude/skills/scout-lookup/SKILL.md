---
name: scout-lookup
description: Quick single-topic Scout Report lookup for a location or hunting unit. Use for targeted research queries.
argument-hint: "<location + topic>"
---

Quick single-topic Scout Report lookup for a location or hunting unit.

Arguments: $ARGUMENTS
(Free text — location + topic — e.g., `"nearest hospital to Colorado GMU 85"` or `"meat processors near Steamboat Springs CO"` or `"cell coverage Unit 7 Wyoming"`)

## Your Task

Run a focused web search for the topic and location specified in the arguments. Return clean, structured results ready to use in a Scout Report.

## Steps

1. **Parse the query** — Identify the topic (medical, logistics, campgrounds, meat processors, game warden, cell coverage, road conditions, predators) and the location from `$ARGUMENTS`.

2. **Run 2–4 targeted web searches** — Be specific. Include state, county, or unit name in queries. Use official sources where possible.

3. **Return structured results** — Format as a TypeScript array of objects appropriate for the topic:

   **Medical example:**
   ```typescript
   [
     {
       name: 'Yampa Valley Medical Center',
       type: 'hospital',
       address: '1024 Central Park Dr, Steamboat Springs, CO 80487',
       phone: '(970) 871-2121',
       distance_from_unit: '~45 min from Unit 14',
       notes: 'Level IV trauma center',
       source: 'https://...',
     }
   ]
   ```

   **Meat processor example:**
   ```typescript
   [
     {
       name: 'Elk Mountain Meats',
       address: '123 Main St, Craig, CO',
       phone: '(970) 555-1234',
       accepts_pack_in: true,
       cold_storage: true,
       appointment_required: true,
       website: null,
       notes: 'Elk and deer only, no bear',
       source: 'https://...',
     }
   ]
   ```

4. **Note anything unverified** — If you couldn't confirm a detail (e.g., phone number, current hours), flag it with `// VERIFY`.

5. **Include sources** — List the URLs you used at the bottom.

## Rules
- Never invent data. If you can't find it, say so.
- Prefer official sources: state wildlife agency, county health dept, Recreation.gov, USFS, BLM
- Secondary sources: hunting forums, GoHunt unit reviews, HuntData
- If the query is too vague to search effectively, ask for clarification before searching
