---
name: audit-duplicates
description: Detect API routes that redundantly call logBronze() after aiCall(). Use when checking for duplicate bronze logging.
argument-hint: "[verbose | route-prefix]"
user-invocable: false
---

Audit: Duplicate Bronze Logging — Detect API routes that redundantly call `logBronze()` after `aiCall()`.

Arguments: $ARGUMENTS
(Optional — no arguments needed. If provided, can be "verbose" for extra detail or a specific route prefix like "/hunts" to scope the audit.)

## Your Task

Find API routes that call both `aiCall()` and `logBronze()`. Since `aiCall()` (in `src/lib/ai/client.ts`) already calls `logBronze` internally for every AI response, any route-level `logBronze` call that logs the same AI response is redundant and should be removed.

## Why This Matters

Duplicate `logBronze` calls create double entries in the `ai_responses` bronze table, inflating storage and corrupting analytics. The medallion architecture requires exactly one bronze record per external data event.

## Steps

### 1. Find all files that import `logBronze`

Search all files under `src/app/api/` for imports of `logBronze` (from `@/lib/ai/client` or `@/lib/ai`).

### 2. Check each file for `aiCall` usage

For each file found in step 1, check whether it also imports or calls `aiCall`.

### 3. Classify each occurrence

For each file with both `logBronze` and `aiCall`:
- Read the file and find where `logBronze` is called
- Determine if `logBronze` is logging the result of an `aiCall()` invocation — if so, it is a **duplicate**
- Determine if `logBronze` is logging something OTHER than an `aiCall` result (e.g., a raw response from Open-Meteo, USGS, or another non-AI external API) — if so, it is **NOT a duplicate** and should be kept

### 4. Output the report

Print results in this format:

```
## Duplicate Bronze Logging Audit — <date>

### How aiCall + logBronze interact
`aiCall()` in `src/lib/ai/client.ts` calls `logBronze()` internally after every
AI request. Any route that also calls `logBronze()` for the same AI response
creates a duplicate bronze record.

### Findings
| File | Has aiCall | Has logBronze | logBronze Target | Status |
|------|-----------|--------------|-----------------|--------|
| src/app/api/hunting/scout-data/route.ts | YES | YES | AI response | DUPLICATE — remove logBronze |
| src/app/api/hunting/field-map/conditions/route.ts | NO | YES | Open-Meteo API | OK — non-AI external data |
| ... | ... | ... | ... | ... |

### Duplicates Found
1. `src/app/api/example/route.ts` — Line XX: `logBronze(...)` logs the aiCall result. Remove this call and clean up the unused import.

### Non-AI Bronze Logging (keep these)
1. `src/app/api/example/route.ts` — Line XX: `logBronze(...)` logs a non-AI external API response. This is correct medallion pattern usage.

### Summary
- Files scanned: X
- Duplicates found: X (REMOVE these logBronze calls)
- Legitimate non-AI bronze logs: X (KEEP these)
```

### 5. Suggested fix for each duplicate

For each duplicate found, specify:
- The exact `logBronze(...)` call to remove (with line number)
- Whether the `logBronze` import can also be removed (i.e., no other `logBronze` calls remain in the file)
- Any related variables that become unused after removal (e.g., a `bronzeId` variable that was only used to store the `logBronze` return value)

## Rules
- Read every file — do not guess from file names alone
- A file with `logBronze` but WITHOUT `aiCall` is never a duplicate — it is logging a non-AI external source, which is correct
- A file with both `aiCall` and `logBronze` is only a duplicate if `logBronze` is logging the AI response from `aiCall`. If `logBronze` is logging a separate external API call in the same route, it is legitimate
- `aiCall()` always logs to bronze internally — this is guaranteed by the framework in `src/lib/ai/client.ts`
- If `$ARGUMENTS` contains "verbose", include the full `logBronze(...)` call source for each finding
- If `$ARGUMENTS` contains a route prefix, only audit routes matching that prefix
