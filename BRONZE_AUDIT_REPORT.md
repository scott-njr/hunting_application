# Duplicate Bronze Logging Audit Report

**Date**: 2026-03-11
**Status**: CLEAN ✓
**Auditor**: Claude Code

---

## Executive Summary

**No duplicate `logBronze()` calls detected.** All 10 API routes that use `aiCall()` correctly delegate bronze logging to the internal `aiCall()` implementation. Zero redundant logging calls found.

---

## Methodology

1. Searched all files under `src/app/api/` for imports of `logBronze`
2. Identified all routes that import and call `aiCall()`
3. For each route, verified whether it also calls `logBronze` (would indicate duplication)
4. Analyzed logging architecture and call patterns

---

## Architecture Overview

### logBronze Definition
- **Location**: `/src/lib/ai/client.ts` (lines 24-61)
- **Exported via**: `/src/lib/ai/index.ts`
- **Purpose**: Fire-and-forget logging to `ai_responses` bronze table
- **Signature**:
```typescript
export function logBronze(data: {
  userId: string
  module: string
  feature: string
  inputLength: number
  rawResponse: string
  tokensInput?: number
  tokensOutput?: number
  flags: string[]
  durationMs: number
  sanitizedInput?: string
})
```

### aiCall() Internal Logging
`aiCall()` at `/src/lib/ai/client.ts` automatically calls `logBronze()` internally:
- **Success path** (line 186-197): Logs after successful AI response with full token counts
- **Failure paths** (lines 129-138, 212-221): Logs via `logAIInteraction()` on input validation failure or API error
- **No manual logging needed** in route handlers - it's implicit

---

## Routes Audit Results

### All 10 Routes Using aiCall() - CLEAN

#### 1. `/src/app/api/hunting/scout-data/route.ts`
- **aiCall Usage**: 2 calls (sections generator + POI generator)
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Calls aiCall twice, parses JSON via extractJSON(), logs bronze internally

#### 2. `/src/app/api/hunting/unit-scout/route.ts`
- **aiCall Usage**: Multiple (handleGenerate + handleChat)
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Unit scout report generation with follow-up chat; all logging delegated

#### 3. `/src/app/api/fitness/wow/generate/route.ts`
- **aiCall Usage**: 1 call
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Note**: Dev-only endpoint; production uses `/api/cron/wow`

#### 4. `/src/app/api/cron/wow/route.ts`
- **aiCall Usage**: 1 call (with userId: 'cron-system')
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Note**: Vercel cron job running Mondays 6AM UTC

#### 5. `/src/app/api/fitness/coach/route.ts`
- **aiCall Usage**: 1 call
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Fetches coach context, builds history, calls aiCall once

#### 6. `/src/app/api/fitness/plans/[planId]/adjust/route.ts`
- **aiCall Usage**: 1 call (feature varies: run/strength/meal)
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Dynamic token limits (8k-16k) based on plan type

#### 7. `/src/app/api/fitness/plans/[planId]/swap-meal/route.ts`
- **aiCall Usage**: 1 call
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Single meal replacement; token limit 1024

#### 8. `/src/app/api/fitness/plans/route.ts`
- **aiCall Usage**: 1 call in POST handler
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Route handles GET/POST/DELETE; only POST calls aiCall

#### 9. `/src/app/api/webhooks/issue-triage/route.ts`
- **aiCall Usage**: 1 call (bug triage classification)
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Webhook-triggered triage; uses userId: 'system'

#### 10. `/src/app/api/admin/issues/triage/route.ts`
- **aiCall Usage**: 1 call (same classification logic as webhook)
- **logBronze Imports**: NO
- **Manual logBronze Calls**: 0
- **Status**: ✓ CLEAN
- **Pattern**: Manual admin trigger for triage (same logic as webhook)

---

## Verification Results

### Import Search
- **Grep for `import.*logBronze` in `/src/app/api/`**: 0 matches
- **Grep for `logBronze()` calls in `/src/app/api/`**: 0 matches
- **Conclusion**: No route imports or calls logBronze directly

### Grep Results
```
Files with aiCall imports (10 total):
- src/app/api/hunting/unit-scout/route.ts
- src/app/api/fitness/wow/generate/route.ts
- src/app/api/cron/wow/route.ts
- src/app/api/webhooks/issue-triage/route.ts
- src/app/api/fitness/coach/route.ts
- src/app/api/fitness/plans/[planId]/adjust/route.ts
- src/app/api/fitness/plans/[planId]/swap-meal/route.ts
- src/app/api/fitness/plans/route.ts
- src/app/api/hunting/scout-data/route.ts
- src/app/api/admin/issues/triage/route.ts

Files with logBronze definitions/exports:
- src/lib/ai/client.ts (definition + usage in aiCall)
- src/lib/ai/index.ts (re-export only)
```

---

## Summary Table

| Route | aiCall Calls | logBronze Imports | Direct Calls | Status |
|-------|-------------|-------------------|--------------|--------|
| hunting/scout-data | 2 | ✗ | 0 | ✓ CLEAN |
| hunting/unit-scout | 3+ | ✗ | 0 | ✓ CLEAN |
| fitness/wow/generate | 1 | ✗ | 0 | ✓ CLEAN |
| cron/wow | 1 | ✗ | 0 | ✓ CLEAN |
| fitness/coach | 1 | ✗ | 0 | ✓ CLEAN |
| fitness/plans/[]/adjust | 1 | ✗ | 0 | ✓ CLEAN |
| fitness/plans/[]/swap-meal | 1 | ✗ | 0 | ✓ CLEAN |
| fitness/plans | 1 | ✗ | 0 | ✓ CLEAN |
| webhooks/issue-triage | 1 | ✗ | 0 | ✓ CLEAN |
| admin/issues/triage | 1 | ✗ | 0 | ✓ CLEAN |
| **TOTAL** | **13+** | **0** | **0** | **✓ CLEAN** |

---

## Correct Pattern

All routes follow this correct pattern:
```typescript
// 1. Call aiCall() with module/feature/message/userId/context
const result = await aiCall({
  module: 'hunting',
  feature: 'scout_report',
  userMessage: prompt,
  userId: user.id,
  maxTokens: 1024,
})

// 2. Check success
if (!result.success) {
  return NextResponse.json({ error: result.error }, { status: 500 })
}

// 3. Parse JSON if needed
const parsed = extractJSON(result.response)

// 4. Store in database
await supabase.from('table').update(data).eq('id', id)

// 5. Increment quota
await supabase.rpc('increment_module_ai_queries', { ... })

// NOTE: logBronze() is NOT called here - it's implicit in aiCall()
```

---

## Architecture Compliance

✓ **Bronze logging is centralized** in `aiCall()` function
✓ **No redundant calls** across any route
✓ **Automatic on all AI interactions** (success and failure paths)
✓ **Consistent logging** across all modules (hunting, fitness, system)
✓ **Fire-and-forget pattern** prevents blocking responses

---

## Recommendations

**No action required.** The codebase is correctly implemented.

The architecture ensures:
1. Single source of truth for AI logging (aiCall)
2. No duplication across 10 routes
3. Automatic application to all AI calls
4. Consistent flags, tokens, and metadata capture
5. Fire-and-forget safety prevents response delays

**Best practice**: Continue relying on aiCall's internal logBronze call and never import logBronze directly in route handlers.

---

## Files Analyzed

- `/src/lib/ai/client.ts` - Core logging function and aiCall implementation
- `/src/lib/ai/index.ts` - Exports
- `/src/app/api/hunting/scout-data/route.ts` - Audit
- `/src/app/api/hunting/unit-scout/route.ts` - Audit
- `/src/app/api/fitness/wow/generate/route.ts` - Audit
- `/src/app/api/cron/wow/route.ts` - Audit
- `/src/app/api/fitness/coach/route.ts` - Audit
- `/src/app/api/fitness/plans/[planId]/adjust/route.ts` - Audit
- `/src/app/api/fitness/plans/[planId]/swap-meal/route.ts` - Audit
- `/src/app/api/fitness/plans/route.ts` - Audit
- `/src/app/api/webhooks/issue-triage/route.ts` - Audit
- `/src/app/api/admin/issues/triage/route.ts` - Audit
