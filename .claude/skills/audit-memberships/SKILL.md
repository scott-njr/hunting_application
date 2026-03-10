---
name: audit-memberships
description: Audit the membership tier system, module subscriptions, and tier-gated access control end-to-end.
argument-hint: "[verbose | fix | module-slug]"
user-invocable: false
---

Audit the membership tier system, module subscriptions, and tier-gated access control end-to-end.

Arguments: $ARGUMENTS
(Optional — no arguments needed. If provided, can be "verbose" for extra detail, "fix" for safe auto-fixes, or a module slug like "fitness" to scope the audit.)

## Your Task

Systematically verify that the membership and subscription system correctly gates access when users upgrade, downgrade, or cancel. Trace the full lifecycle: pricing page selection → API tier change → DB update → middleware enforcement → layout enforcement → UI state consistency. Output a structured report with findings and severity levels.

## Architecture Overview

This app has TWO coexisting tier systems:

### Module Tier (Source of Truth)
- **Table**: `module_subscriptions` — one row per user per module
- **Values**: `free | basic | pro` (in `ModuleTier` type)
- **Status**: `active | inactive | cancelled | trialing`
- **File**: `src/lib/modules.ts` — `getUserModuleTier()`, `hasModuleAccess()`, `MODULE_TIER_RANK`
- **Access logic**: `status='active'` AND `tier != 'free'` → access granted

### Global Membership Tier (Derived, Display-Only)
- **Table**: `members.membership_tier` — synced to max of all module tiers
- **Values**: `free | basic | pro | elite` (in `MembershipTier` type)
- **File**: `src/lib/tier.ts` (marked `@deprecated`)
- **MUST NOT be used for access decisions** — only for display in account/admin pages

### Two-Layer Access Enforcement (CRITICAL)
Module access MUST be enforced at TWO levels:
1. **Middleware** (`middleware.ts`) — first gate, checks `module_subscriptions` on every request
2. **Module layout** (`src/app/{module}/(module)/layout.tsx`) — second gate, server-side redirect if `moduleTier === 'free'`

**Why two layers?** Next.js App Router client-side navigation can serve cached responses that bypass middleware. The layout runs as a Server Component on every render and cannot be bypassed. Both layers are required.

### Tier Change Flow
```
User selects tier on /pricing or /onboarding
    → POST /api/subscriptions/select-tier (service role — bypasses RLS)
    → Upserts module_subscriptions row (tier + status='active')
    → Syncs members.membership_tier to max of all active tiers
    → User accesses module route
    → Layer 1: Middleware checks module_subscriptions → redirects if free
    → Layer 2: Module layout checks moduleTier → redirects if free
    → Module page renders with sidebar showing tier
```

### Cancel Flow
```
User clicks "Cancel All" on /account/subscriptions
    → POST /api/subscriptions/cancel-all (service role — bypasses RLS)
    → Sets ALL module_subscriptions: tier='free', status='cancelled'
    → Sets members: membership_tier='free', membership_status='cancelled'
```

**CRITICAL**: Cancel MUST use a server-side API route with service role key. `module_subscriptions` has NO client-side UPDATE RLS policy — client-side `.update()` calls silently fail (0 rows affected, no error).

## Steps

### 1. Read tier system source files

Read these files and extract the tier definitions, rank maps, and access-check functions:
- `src/lib/modules.ts` — `ModuleTier`, `MODULE_TIER_RANK`, `getUserModuleTier()`, `hasModuleAccess()`, `getUserModuleSubscriptions()`
- `src/lib/tier.ts` — `MembershipTier`, verify it's marked deprecated and not used for access decisions
- `src/types/database.types.ts` — `module_subscriptions` and `members` table types

Verify:
- [ ] `getUserModuleTier()` checks BOTH `status='active'` AND `tier` value
- [ ] `getUserModuleTier()` defaults to `'free'` if no row or inactive status
- [ ] `MODULE_TIER_RANK` has correct ordering (free=0 < basic=1 < pro=2)
- [ ] `hasModuleAccess()` uses `>=` comparison on ranks

### 2. Audit the tier change APIs

Read BOTH subscription API routes:
- `src/app/api/subscriptions/select-tier/route.ts` — individual module tier change
- `src/app/api/subscriptions/cancel-all/route.ts` — cancel all subscriptions

For select-tier, verify:
- [ ] Authenticates user via `getUser()`
- [ ] Validates `moduleSlug` against known module list
- [ ] Validates `tier` against valid tier values
- [ ] Uses **service role client** for the upsert (NOT the user's Supabase client)
- [ ] Upserts to `module_subscriptions` with `status: 'active'` (so re-subscribing after cancel works)
- [ ] Syncs `members.membership_tier` to max of all active module tiers
- [ ] Returns appropriate error responses for invalid input

For cancel-all, verify:
- [ ] Authenticates user via `getUser()`
- [ ] Uses **service role client** for the update (NOT the user's Supabase client)
- [ ] Updates ALL active `module_subscriptions` rows: sets `tier='free'` AND `status='cancelled'`
- [ ] Syncs `members.membership_tier` to `'free'` and `membership_status` to `'cancelled'`

Flag if:
- Either API uses the user's Supabase client to write `module_subscriptions` → **CRITICAL** (will silently fail due to RLS — no UPDATE policy exists for users)
- The API accepts arbitrary tier strings without validation → **CRITICAL**
- Cancel only sets `tier='free'` but doesn't set `status='cancelled'` → **MEDIUM**
- Missing auth check → **CRITICAL**

### 3. Audit middleware tier gates

Read `middleware.ts` and trace the module access check:
- [ ] Extracts module slug from URL path correctly
- [ ] Queries `module_subscriptions` for the specific module
- [ ] Checks `status='active'` before trusting `tier` value
- [ ] Treats missing/inactive rows as `'free'`
- [ ] Redirects free-tier users to `/pricing` with correct query params (`upgrade`, `module`, `redirectTo`)
- [ ] Does NOT use `members.membership_tier` for access decisions

Check `MODULE_PREFIXES` — verify every active module with sub-routes is listed.

Flag if:
- Middleware uses global `membership_tier` instead of module-specific tier → **CRITICAL**
- A module with paid features is missing from gated prefixes → **CRITICAL**
- Redirect URL is missing `redirectTo` param (user loses their place) → **MEDIUM**

### 4. Audit module layout tier gates (CRITICAL — #1 bypass risk)

Glob for `src/app/*/(module)/layout.tsx` and read EVERY layout file.

For EACH layout, verify ALL of these:
- [ ] Calls `await createClient()` (server client) and `supabase.auth.getUser()`
- [ ] Redirects to `/auth/login` if no user
- [ ] Calls `getUserModuleTier(supabase, user.id, '<correct-slug>')` with the correct module slug
- [ ] **CRITICAL: Has `if (moduleTier === 'free') redirect('/pricing?upgrade=basic&module=<slug>')` BEFORE the return statement** — this is the server-side tier gate that cannot be bypassed
- [ ] Passes `moduleTier` to `ModuleSidebar`

**Check ALL 6 modules**: hunting, archery, firearms, fishing, fitness, medical.

Flag if:
- **Any layout fetches `moduleTier` but does NOT redirect when `tier='free'`** → **CRITICAL** — this is the #1 tier bypass bug. Middleware alone is insufficient because Next.js client-side router caching can skip middleware on soft navigations. The layout is the defense-in-depth layer.
- Layout uses wrong module slug in `getUserModuleTier()` call → **CRITICAL**
- Layout is missing entirely for a module that has sub-routes → **CRITICAL**
- Layout doesn't pass tier to sidebar → **LOW**

### 5. Audit pricing/tier selection UI

Read these files for the tier selection flow:
- `src/components/pricing/tier-cards.tsx` — the shared tier selection component
- `src/app/pricing/page.tsx` — pricing page
- `src/app/onboarding/page.tsx` — onboarding tier selection (Step 2)
- `src/app/account/subscriptions/page.tsx` — subscription management

For TierCards, verify:
- [ ] Fetches current tiers from `module_subscriptions` on mount
- [ ] Only shows `status='active'` subscriptions as current
- [ ] Sends tier changes via `fetch('/api/subscriptions/select-tier')` (NOT client-side Supabase)
- [ ] Handles API errors gracefully (shows error AND rolls back `pendingTiers` to `savedTiers`)
- [ ] Calls `router.refresh()` after successful tier change
- [ ] Handles `redirectTo` search param (redirects user back after upgrade)

For account subscriptions page, verify:
- [ ] Cancel action calls `/api/subscriptions/cancel-all` via `fetch()` (NOT client-side Supabase `.update()`)
- [ ] Cancel does NOT use `supabase.from('module_subscriptions').update(...)` — this silently fails due to RLS
- [ ] Cancel calls `router.refresh()` to invalidate cached auth state
- [ ] Error states are shown to the user (not just `console.error`)

Flag if:
- Cancel uses client-side Supabase to update `module_subscriptions` → **CRITICAL** (silently fails — no UPDATE RLS policy)
- TierCards updates local state before API confirms success → **HIGH**
- No rollback of pending state on API failure → **MEDIUM**
- Multiple parallel API calls without error rollback → **MEDIUM**

### 6. Audit home page (command center)

Read `src/app/home/page.tsx` and the module card component:
- `src/components/home/module-card.tsx`

Verify:
- [ ] Uses `getUserModuleSubscriptions()` to fetch subscriptions
- [ ] `subscribedSlugs` filters OUT modules where `tier === 'free'`
- [ ] `hasHunting`, `hasFitness`, etc. check `tier !== 'free'` (not just `!!subscriptions.module`)
- [ ] `ModuleCard` treats `tier='free'` as NOT subscribed (`isSubscribed` must check `tier !== 'free'`)
- [ ] Free-tier modules show "Add Module" CTA, NOT quick-access links to gated routes
- [ ] AI usage section only shows modules with paid tiers

Flag if:
- `subscribedSlugs` includes modules with `tier='free'` → **HIGH** (shows paid UI for free users)
- `ModuleCard` uses `!!subscription` without checking `tier !== 'free'` → **HIGH**
- Home page shows quick-access links to gated routes for free modules → **HIGH**

### 7. Audit RLS policies on module_subscriptions

Read the migration files that create RLS policies for `module_subscriptions`:
- Glob for `supabase/migrations/*module*` and `supabase/migrations/*subscription*`

Verify:
- [ ] RLS is ENABLED on `module_subscriptions`
- [ ] Users can only SELECT their own subscriptions (`auth.uid() = user_id`)
- [ ] There is NO INSERT policy for authenticated users (service role only)
- [ ] There is NO UPDATE policy for authenticated users (service role only)
- [ ] Service role can insert/update (bypasses RLS)
- [ ] No policy allows users to escalate their own tier

Flag if:
- Users can UPDATE their own `module_subscriptions` rows client-side → **CRITICAL**
- Users can INSERT into `module_subscriptions` client-side → **CRITICAL**
- Missing RLS on `module_subscriptions` → **CRITICAL**

### 8. Audit tier-gated features within modules

Search for code that checks tier within module pages (not just at the route level):
- Grep for `getUserModuleTier`, `hasModuleAccess`, `moduleTier`, `ModuleTier` in `src/app/` and `src/components/`
- Check if any features within a module page are conditionally rendered based on tier

Verify:
- [ ] Feature-level tier checks use `hasModuleAccess()` or `hasModuleTierAccess()` (not string comparison)
- [ ] AI query limits are checked per-module via `module_subscriptions.ai_queries_this_month`
- [ ] AI query counter is incremented after successful AI call (via `increment_module_ai_queries` RPC)

Flag if:
- Feature-level tier check uses `members.membership_tier` → **HIGH**
- AI queries not counted/limited per module → **MEDIUM**
- Tier check done client-side only (can be bypassed) → **HIGH**

### 9. Audit the new-user initialization trigger

Read `supabase/migrations/0045_grant_all_modules_free.sql` (or the relevant trigger migration):
- [ ] Trigger fires on `members` insert
- [ ] Creates rows for ALL 6 modules with `tier='free'`, `status='active'`
- [ ] Uses `ON CONFLICT DO NOTHING` to avoid duplicates
- [ ] Module list in trigger matches `ALL_MODULES` in `src/lib/modules.ts`

Flag if:
- Trigger is missing a module that exists in `ALL_MODULES` → **HIGH**
- Trigger creates rows with tier other than `'free'` → **CRITICAL**

### 10. Output the report

Print results in this format:

```
## Membership Audit Report — <date>

### Tier System Configuration
| System | Source | Values | Used For |
|--------|--------|--------|----------|
| Module Tier | module_subscriptions | free/basic/pro | Access decisions |
| Global Tier | members.membership_tier | free/basic/pro/elite | Display only |

### Tier Change APIs
| Route | Auth | Service Role | Validates Input | Syncs Global | Status |
|-------|------|-------------|----------------|-------------|--------|
| POST /api/subscriptions/select-tier | getUser() | YES | YES | YES | SECURE |
| POST /api/subscriptions/cancel-all | getUser() | YES | N/A | YES | SECURE |

### Access Enforcement (Two-Layer)
| Module | Middleware Gate | Layout Gate | Both Layers? | Status |
|--------|---------------|------------|-------------|--------|
| hunting | YES — redirects if free | YES — redirects if free | YES | SECURE |
| fitness | YES | YES | YES | SECURE |
| ... | ... | ... | ... | ... |

### Middleware Tier Gates
| Module | In MODULE_PREFIXES? | Check Method | Redirect Params | Status |
|--------|---------------------|-------------|-----------------|--------|
| hunting | YES | module_subscriptions | upgrade+module+redirectTo | SECURE |
| ... | ... | ... | ... | ... |

### Module Layout Tier Gates (CRITICAL CHECK)
| Module | Layout Path | Fetches Tier | Redirects if Free | Status |
|--------|------------|-------------|-------------------|--------|
| hunting | src/app/hunting/(module)/layout.tsx | getUserModuleTier('hunting') | YES | SECURE |
| ... | ... | ... | ... | ... |

### UI Tier Consistency
| Component | Fetches Tier From | Free = Unsubscribed? | Error Rollback | Status |
|-----------|------------------|---------------------|---------------|--------|
| TierCards | module_subscriptions | N/A | YES | PASS |
| ModuleCard | subscription prop | YES (tier !== 'free') | N/A | PASS |
| Home page | getUserModuleSubscriptions() | YES (filters free) | N/A | PASS |
| Cancel (subscriptions) | API /cancel-all | N/A | N/A | PASS |

### RLS Policies
| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| module_subscriptions | own rows | service role only | service role only | cascade | SECURE |

### Findings
| # | Severity | Location | Issue | Recommended Fix |
|---|----------|----------|-------|----------------|
| 1 | CRITICAL | ... | ... | ... |
| 2 | HIGH | ... | ... | ... |

### Summary
- Total checks: X
- PASS: X
- CRITICAL: X
- HIGH: X
- MEDIUM: X
- LOW: X

### Priority Fix List
1. [CRITICAL] ...
2. [HIGH] ...
3. [MEDIUM] ...
```

## Rules

- Read every file — do not guess tier logic from function names
- Follow the FULL chain: UI selection → API call (service role) → DB update → middleware check → layout check → page render
- **TWO-LAYER ENFORCEMENT IS MANDATORY**: Every module MUST have BOTH middleware AND layout-level tier gates. A module with only one layer is **CRITICAL**.
- **NEVER** suggest using `members.membership_tier` for access decisions — it's deprecated and display-only
- **NEVER** add auth imports to public module root pages (`/hunting`, `/archery`, etc.)
- **NEVER** use client-side Supabase to write `module_subscriptions`** — RLS has no UPDATE/INSERT policy for users. All writes MUST go through API routes that use the service role key.
- A tier gate is only SECURE if it's enforced server-side (middleware AND layout) — client-side checks are supplementary only
- RLS policies on `module_subscriptions` are critical — users must NOT be able to escalate their own tier via client-side Supabase calls
- If `$ARGUMENTS` contains "verbose", include specific line numbers and code snippets for each check
- If `$ARGUMENTS` contains "fix", apply safe fixes only: add missing layout redirects, fix UI state management, add error handling. Do NOT modify RLS policies, middleware logic, or database schema
- If `$ARGUMENTS` contains a module slug, only audit that module's tier flow
- Severity levels: **CRITICAL** = access bypass possible, **HIGH** = broken UX or data inconsistency, **MEDIUM** = edge case or semantic issue, **LOW** = polish/improvement

## Known Bug Patterns (from past audits)

These are real bugs that have been found and fixed in this codebase. The audit MUST verify they haven't regressed:

1. **Layout missing tier redirect** — Layout fetches `moduleTier` but only passes it to `ModuleSidebar` for display without redirecting free users. Fix: add `if (moduleTier === 'free') redirect('/pricing?upgrade=basic&module=<slug>')` before the return.

2. **Cancel using client-side Supabase** — Cancel button calls `supabase.from('module_subscriptions').update({ tier: 'free' })` using the user's client. This silently fails (0 rows, no error) because `module_subscriptions` has no UPDATE RLS policy. Fix: use `fetch('/api/subscriptions/cancel-all')` which uses the service role key.

3. **Home page treating free as subscribed** — `getUserModuleSubscriptions()` returns ALL `status='active'` rows including `tier='free'`. Code checks `!!subscriptions.fitness` which is true for free users (signup trigger creates free rows for all modules). Fix: filter `subscribedSlugs` by `tier !== 'free'`, and `ModuleCard` must check `subscription.tier !== 'free'`.

4. **TierCards no rollback on failure** — `saveAllChanges()` fires parallel API requests. On partial failure, `pendingTiers` stays at the new values while DB is in a mixed state. Fix: reset `pendingTiers` to `savedTiers` on any failure.

5. **select-tier must re-sync global tier AND reset membership_status** — After cancellation, `members.membership_status` is `'cancelled'`. When a user re-subscribes via `select-tier`, the global tier sync must also set `membership_status: 'active'`, otherwise the account page shows "Cancelled" badge despite having paid modules.

6. **select-tier global tier sync accidentally removed** — The `MODULE_TIER_RANK` import and the global tier sync block (re-query all active subs → compute max → update `members.membership_tier`) were accidentally removed during a linter/edit pass. This breaks the Account Tier display. Fix: always keep the sync block after the upsert.

## Pre-Production Testing Note

Until Stripe is wired, tier changes are manual (no payment flow). The system must allow **any authenticated user** to freely switch between tiers for testing purposes. Do NOT add payment validation, trial period enforcement, or downgrade restrictions until Stripe webhooks are integrated. All tier changes go through `/api/subscriptions/select-tier` which is intentionally unrestricted.
