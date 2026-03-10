---
name: audit-auth
description: Run a full authentication and authorization audit across all routes and API endpoints. Use when checking auth protection.
argument-hint: "[verbose | route-prefix]"
user-invocable: false
---

Run a full authentication and authorization audit across all routes and API endpoints.

Arguments: $ARGUMENTS
(Optional — no arguments needed. If provided, can be "verbose" for extra detail or a specific route prefix like "/hunting" to scope the audit.)

## Your Task

Systematically verify that every route and API endpoint in this application has proper auth protection, correct redirects, and no bypass paths. Output a structured report.

## Architecture Overview

This app has THREE categories of pages:

### Category 1 — Public pages (static, no auth)
Routes like `/`, `/pricing`, `/about`, `/newsletter`, `/spearfishing`, `/auth/*`.
These are in the `PUBLIC_ROUTES` array in `middleware.ts`.
They MUST remain pure static Server Components — no `createClient`, no `async`, no `getUser()`, no `redirect()`.

### Category 2 — Public module root pages (static landing pages)
Routes: `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`.
These are in the `PUBLIC_MODULE_ROOTS` array in `middleware.ts`.
**CRITICAL**: These MUST be pure static `export default function` pages with ZERO auth imports.
- NO `createClient` imports
- NO `async` keyword
- NO `getUser()` calls
- NO `redirect()` calls
- They MUST show as `○ (Static)` in Next.js build output
Logged-in users are redirected by middleware via the `MODULE_DEFAULTS` map, NOT by page-level code.

### Category 3 — Authenticated module pages (behind route groups)
Routes like `/hunting/deadlines`, `/firearms/courses`, `/medical/profile`, etc.
These live under `src/app/{module}/(module)/` route group directories.
Each `(module)/layout.tsx` has a server-side auth guard:
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/auth/login')
```

## Steps

### 1. Read the middleware auth config

Read `middleware.ts` and extract:
- `PUBLIC_ROUTES` array (routes that skip auth)
- `PUBLIC_MODULE_ROOTS` array (static landing pages with logged-in redirect)
- `MODULE_DEFAULTS` map (where logged-in users go for each module root)
- `BASIC_REQUIRED_ROUTES` (tier-gated routes)
- `GATED_MODULE_PREFIXES` (module subscription-gated routes)
- `ONBOARDING_EXEMPT` routes
- The `config.matcher` pattern (which paths middleware runs on)

### 2. Audit public module root pages (CRITICAL CHECK)

For each route in `PUBLIC_MODULE_ROOTS`, read the corresponding `src/app/{module}/page.tsx` and verify:
- [ ] File uses `export default function` (not `async`)
- [ ] File does NOT import `createClient` from any supabase path
- [ ] File does NOT import `redirect` from `next/navigation`
- [ ] File does NOT call `getUser()`, `getSession()`, or any auth method
- [ ] File does NOT use `cookies()` or any server-only API

If ANY of these checks fail, flag as **CRITICAL GAP** — this will break the build by making the page dynamic instead of static.

### 3. Audit authenticated module layouts

Glob for `src/app/*/(module)/layout.tsx` and verify each one:
- Calls `await createClient()` (server client)
- Calls `supabase.auth.getUser()`
- Redirects to `/auth/login` if no user
- Wraps children in `ModuleSidebar` with correct `module` prop

### 4. Scan all page routes

Glob for `src/app/**/page.tsx` and `src/app/**/layout.tsx`.

For each route, determine its protection status by checking three layers:

**Layer 1 — Middleware:** Is the route in `PUBLIC_ROUTES` or `PUBLIC_MODULE_ROOTS`? If not, middleware will redirect unauthenticated users to `/auth/login`.

**Layer 2 — Layout:** Does the parent layout (`(module)/layout.tsx`) call `supabase.auth.getUser()` and `redirect()` if no user?

**Layer 3 — Page:** Does the page itself have a server-side auth check? For `'use client'` pages or re-export pages (`export { default } from '...'`), note that they rely on layout + middleware only.

### 5. Scan all API routes

Glob for `src/app/api/**/route.ts`.

For each API route, check:
- Does it call `getUser()` or `auth.getUser()`?
- Does it return a 401 response if no user is found?
- Does it use the service role key (`SUPABASE_SERVICE_ROLE_KEY`)? If so, is there ALSO a user auth check before the service role queries?
- For dev-only endpoints: is there a `NODE_ENV` production guard?

Flag any API route that:
- Has no `getUser()` call at all
- Uses service role key without verifying the caller is authenticated
- Is missing a 401 response path

### 6. Check redirect chain integrity

- Read `src/app/auth/login/page.tsx` — verify it reads `redirectTo` from search params and uses it after successful login
- Read `src/app/auth/signup/page.tsx` — verify it reads `redirectTo` from search params and uses it after successful signup
- Read `src/app/auth/callback/route.ts` — verify it reads `redirectTo` from search params and redirects there after email verification
- Read `next.config.ts` — note any permanent redirects (e.g., `/dashboard` → `/modules`)
- Verify the FULL chain: middleware redirect → login → `redirectTo` → original page

**CRITICAL CHECKS for post-login redirect:**
- Login/signup MUST use `window.location.href = redirectTo` (NOT `router.push()`) after auth — `router.push()` + `router.refresh()` race conditions lose the redirect in Next.js 16
- Middleware tier gates (redirects to `/pricing`) MUST preserve `redirectTo` as a query param so the user returns to their intended page after upgrading
- Signup `emailRedirectTo` MUST include `?redirectTo=` in the callback URL so email verification preserves the destination
- Pricing page / tier-cards component MUST check for `redirectTo` in search params and navigate there after tier selection
- Any component using `useSearchParams()` MUST be wrapped in `<Suspense>` (Next.js 16+ requirement)

### 7. Check for orphan routes

- Any `page.tsx` that is NOT under a `(module)/layout.tsx` with auth AND is not in `PUBLIC_ROUTES` or `PUBLIC_MODULE_ROOTS` → flag as WARNING
- Any route in `PUBLIC_ROUTES` that has no corresponding `page.tsx` → flag as dead config

### 8. Verify client components on public pages

Check `Navbar` and any other client components used on public pages:
- `Navbar` is a `'use client'` component that checks auth client-side — this is OK
- Verify it does NOT cause the parent page to become dynamic (no server imports leaking)

### 9. Output the report

Print results in this format:

```
## Auth Audit Report — <date>

### Critical Check: Public Module Roots
| Route | Static? | No Auth Imports | Status |
|-------|---------|----------------|--------|
| /hunting | ○ Static | YES | PASS |
| /firearms | ○ Static | YES | PASS |
| ... | ... | ... | ... |

### Module Layout Guards
| Module | Layout Path | Auth Guard | Sidebar | Status |
|--------|------------|-----------|---------|--------|
| hunting | src/app/hunting/(module)/layout.tsx | YES | YES | SECURE |
| ... | ... | ... | ... | ... |

### Page Routes
| Route | Middleware | Layout Guard | Page Guard | Status |
|-------|-----------|-------------|------------|--------|
| / | PUBLIC | — | — | SECURE (intentionally public) |
| /hunting/journal | PROTECTED | YES (hunting/(module)/layout.tsx) | Client component | SECURE |
| ... | ... | ... | ... | ... |

### API Routes
| Endpoint | Auth Check | Service Role | Status |
|----------|-----------|-------------|--------|
| GET /api/journal/conditions | getUser() + 401 | No | SECURE |
| ... | ... | ... | ... |

### Redirect Chain
| Flow | Status |
|------|--------|
| Login preserves redirectTo | ??? |
| Login uses window.location.href (not router.push) | ??? |
| Signup preserves redirectTo | ??? |
| Signup emailRedirectTo includes redirectTo param | ??? |
| Auth callback reads redirectTo | ??? |
| Middleware tier gate preserves redirectTo | ??? |
| Pricing page redirects after tier selection | ??? |
| /dashboard → /modules redirect | ??? |

### Summary
- Total routes: X
- Secure: X
- Warnings: X
- Critical Gaps: X (REQUIRES IMMEDIATE FIX)

### Gaps Found (if any)
1. [ROUTE] — [Description of the gap and recommended fix]
```

## Rules
- Read every file — do not guess protection status from file names
- **CRITICAL**: Public module root pages MUST be pure static. Any auth imports = CRITICAL GAP. This is the #1 recurring bug in this codebase.
- A route is only SECURE if it has middleware protection AND at least one of: layout guard or page guard (for non-public routes)
- API routes MUST have their own auth check — they cannot rely on middleware alone (API routes can be called directly via curl/fetch)
- `'use client'` pages that do `getUser()` only to conditionally load data (no redirect) count as WARNING, not SECURE at the page level
- Re-export pages like `export { default } from '@/components/profile/profile-page'` rely entirely on their parent `(module)/layout.tsx` for auth — verify the layout exists
- Service role key usage without auth verification is always a GAP
- If `$ARGUMENTS` contains "verbose", include the specific line numbers where auth checks were found
- If `$ARGUMENTS` contains a route prefix, only audit routes matching that prefix
