---
name: add-hunt-code
description: Translate a raw state hunt code string into a structured hunt_codes database record. Use when parsing hunt codes like "E-E-050-O1-R".
argument-hint: "<hunt-code> [state]"
---

Translate a raw state hunt code string into a structured `hunt_codes` database record.

Arguments: $ARGUMENTS
(Expected format: the raw hunt code string — e.g., `"E-E-050-O1-R"` or `"DE1A-R" CO`)

## Your Task

Parse the hunt code string provided in the arguments above and produce a structured record matching the `hunt_codes` table schema.

## Steps

1. **Check the schema** — Read `src/types/database.types.ts` for the `hunt_codes` table shape. If it doesn't exist yet, use this structure:
   ```
   id, state, code, species, sex, unit, season, weapon, land_type,
   plain_english, is_otc, is_group_eligible, residency, notes, state_url, updated_at
   ```

2. **Identify the state** — If the state is included in the arguments, use it. If not and you can infer it from the code format, do so. Otherwise ask the user which state this code is from before proceeding.

3. **Decode each segment** — Common state code patterns:
   - **Colorado format** (e.g., `E-E-050-O1-R`): Species-Sex-Unit-SeasonCode-Weapon
     - Species: E=Elk, D=Deer, P=Pronghorn, B=Bear, M=Moose, S=Sheep, G=Goat, L=Lion
     - Sex: E=Either, M=Male/Bull, F=Female/Cow, A=Antlered, N=Antlerless
     - Unit: 3-digit GMU number
     - Season code: O1=1st rifle, O2=2nd rifle, etc.; A=Archery; L=Muzzleloader
     - Weapon suffix: R=Rifle, A=Archery, M=Muzzleloader
   - **Wyoming, Montana, Idaho, etc.** have different conventions — use web search if needed to decode

4. **Generate plain English** — Write a clear, plain-English description of what this tag allows. Example: "Bull elk, either weapon, Game Management Unit 50, 1st rifle season"

5. **Determine flags:**
   - `is_otc`: true only if no draw is required for this code
   - `is_group_eligible`: true if Colorado group applications are allowed for this license
   - `residency`: 'resident', 'nonresident', or 'both'

6. **Find the state portal URL** — Web search for the official application or license page for this species/season in the state.

## Output Format

Output as a TypeScript object literal and as a SQL INSERT statement. Example:

```typescript
// hunt_codes record
{
  state: 'CO',
  code: 'E-E-050-O1-R',
  species: 'elk',
  sex: 'either',
  unit: '050',
  season: '1st_rifle',
  weapon: 'rifle',
  land_type: 'public', // or 'private', 'both', null if unknown
  plain_english: 'Bull elk, rifle, Game Management Unit 50, 1st rifle season',
  is_otc: false,
  is_group_eligible: true,
  residency: 'both',
  notes: null, // or any notable restrictions
  state_url: 'https://cpwshop.com',
}
```

## Notes
- Mark any field you couldn't confidently decode with `// VERIFY` inline
- If a segment is ambiguous, explain your interpretation and flag it
- Do not guess — if a segment is truly unknown, leave it null and note why
