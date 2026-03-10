---
name: add-state-draw
description: Add draw data for a new state to the Scout Deadline Tracker. Use when adding state draw deadlines.
argument-hint: "<StateName> <YYYY>"
---

Add draw data for a new state to the Scout Deadline Tracker.

Arguments: $ARGUMENTS
(Expected format: "StateName YYYY" — e.g., "Wyoming 2026")

## Your Task

Generate a correctly-typed `DrawEntry` TypeScript object for the state and year specified in the arguments above. This object will be added to the `DRAWS` array in `src/app/dashboard/deadlines/page.tsx`.

## Steps

1. **Read the schema** — Read `src/app/dashboard/deadlines/page.tsx` to understand the full `DrawEntry` type and see the existing Colorado entry as a style/structure reference.

2. **Web search for draw data** — Search for the following for the specified state and year:
   - Primary draw application open date
   - Primary draw application deadline
   - Primary draw results date
   - Payment deadline (after results)
   - Secondary draw open/close dates (if applicable)
   - Secondary draw results date
   - Leftover/OTC tag sale date (if applicable)
   - Official portal URL for applications
   - Species available in the draw (elk, mule deer, pronghorn, black bear, etc.)
   - Whether archery, rifle, and/or muzzleloader seasons are draw-only
   - Any notable regulation changes for the specified year
   - Any system changes or warnings hunters should know

3. **Search for application requirements** — Find the step-by-step process for applying in this state:
   - License or prerequisite requirements
   - Account setup requirements
   - Application fee notes
   - Non-refundable fee warnings
   - Choice limits (how many unit choices per species)

4. **Search for any 2028+ system warnings** — Check if this state has any upcoming point system changes or major regulation shifts hunters should know about.

5. **Output the DrawEntry object** — Produce a complete TypeScript object matching the `DrawEntry` type exactly. Use the Colorado entry as a style template.

## Output Format

Output the complete DrawEntry object as TypeScript code, ready to paste into the `DRAWS` array. Example shape:

```typescript
{
  state: 'Wyoming',
  code: 'WY',
  species: ['elk', 'mule_deer', 'pronghorn', /* ... */],
  seasons: ['archery', 'rifle', 'muzzleloader'],
  year: 2026,
  openDate: 'Jan 1, 2026',
  deadline: 'Jan 31, 2026',
  resultsDate: 'Mar 15, 2026',
  paymentDeadline: 'Apr 1, 2026',
  secondaryOpen: 'Apr 15, 2026',
  secondaryClose: 'Apr 30, 2026',
  secondaryResults: 'May 10, 2026',
  leftoverDate: 'May 15, 2026',
  portalUrl: 'https://...',
  status: 'upcoming', // or 'open' or 'closed' based on today's date
  note: '...', // any notable changes for this year (or omit if none)
  warning2028: '...', // any upcoming system changes (or omit if none)
  gmuNotes: '...', // unit system explanation for hunters
  requirements: [
    {
      step: 1,
      label: '...',
      detail: '...',
      link: { label: '...', url: '...' }, // optional
    },
    // ...
  ],
},
```

## Important Notes
- Mark any field you couldn't confirm with a `// TODO: verify` comment inline
- If the state has no secondary draw, use empty strings for secondary fields
- Set `status` based on today's date relative to the draw window
- Keep `requirements` practical and step-by-step, like the Colorado example
