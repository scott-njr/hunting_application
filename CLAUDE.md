# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

**Important:** Node.js is installed via Homebrew. Always run `source ~/.zprofile` before any npm/node commands.

```bash
source ~/.zprofile && npm run dev        # Start dev server
source ~/.zprofile && npm run build      # Production build
source ~/.zprofile && npm run lint       # ESLint
source ~/.zprofile && npm test           # Run all tests (vitest)
source ~/.zprofile && npx vitest run src/lib/__tests__/tier.test.ts  # Single test file
source ~/.zprofile && npx vitest --watch # Watch mode
source ~/.zprofile && npx vercel --prod  # Deploy to Vercel
```

## Architecture

**Lead the Wild by Praevius** — A multi-module outdoor skills platform (Next.js 16 App Router + Supabase + Tailwind CSS).

### Two Layers: Nav2 (Public) vs Module (Authenticated)

**Nav2 pages** — Public informational pages accessible from the top nav bar (`Nav2`). These describe what each module offers. No auth required, no sidebar. Layout: `Navbar` + `Nav2` + content + footer. When the user says "Nav2", they mean these public-facing overview pages.

**CRITICAL: Nav2 pages must NEVER contain auth logic.** No `createClient`, no `isLoggedIn`, no `async` server components, no conditional rendering based on login state. They are plain `export default function` components — identical pattern to `/medical`, `/blog`, `/contact`. This applies to ALL Nav2 pages including `/hunting` and `/archery`.

**Module pages** — Authenticated app pages with the left sidebar (`ModuleSidebar`). These are the actual tools (deadlines, courses, community, profile, etc.). When the user says "module", they mean these logged-in, sidebar-nav pages.

### Route Structure

Active modules use **route groups** to separate the public root page from authenticated sub-routes:

```
src/app/hunting/
  page.tsx              ← Nav2 public overview (no layout wrapping)
  (module)/
    layout.tsx          ← ModuleSidebar + auth guard (wraps all sub-routes)
    deadlines/page.tsx  ← Module page (authenticated, sidebar)
    courses/page.tsx
    community/page.tsx
    ...etc
```

The `(module)` route group is invisible in URLs — `/hunting/deadlines` works normally.

Coming-soon modules (spearfishing, butcher-block, mindset) are simple public pages only — no route group, no layout, no sub-routes.

### Module Registry

| Module | Slug | Status | Nav2 Page | Module Pages |
|--------|------|--------|-----------|-------------|
| Command Center | `home` | Active | `/dashboard` | `/home` (authenticated dashboard) |
| Hunting | `hunting` | Active | `/hunting` | `/hunting/deadlines`, `/hunting/courses`, etc. |
| Archery | `archery` | Active | `/archery` | `/archery/courses`, `/archery/community`, etc. |
| Firearms | `firearms` | Active | `/firearms` | `/firearms/courses`, `/firearms/community`, etc. |
| Medical | `medical` | Active | `/medical` | `/medical/courses`, `/medical/community`, etc. |
| Fishing | `fishing` | Active | `/fishing` | `/fishing/courses`, `/fishing/community`, etc. |
| Fitness | `fitness` | Active | `/fitness` | `/fitness/coach`, `/fitness/meal-prep`, etc. |
| Spearfishing | `spearfishing` | Coming soon | `/spearfishing` | None |
| Butcher Block | `butcher-block` | Coming soon | `/butcher-block` | None |
| Mindset | `mindset` | Coming soon | `/mindset` | None |

- Module definitions: `src/lib/modules.ts` (`ModuleSlug`, `ModuleTier`, `ALL_MODULES`)
- Module sidebar nav config: `src/components/layout/module-sidebar.tsx` (`MODULE_NAV`)
- Nav2 link config: `src/components/layout/nav2.tsx`
- `/dashboard` is the public Nav2 page for Command Center; `/home` is the authenticated Command Center module

### Auth & Route Protection (`middleware.ts`)
1. Preview password gate (Vercel deploys only) — when `PREVIEW_PASSWORD` env var is set
2. `updateSession()` refreshes Supabase session — must be called first
3. Public routes bypass auth: `/`, `/pricing`, `/auth/*`, `/contact`, `/onboarding`, plus all Nav2 pages (`/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`, `/blog`, `/about`, etc.)
4. Module sub-routes (e.g., `/hunting/deadlines`) require auth → redirect to `/auth/login`
5. Onboarding gate: new users redirected to `/onboarding` if `onboarding_completed = false`
6. Tier gate: courses and community routes require `basic` tier → redirect to `/pricing?upgrade=basic`

### Supabase Client Rules
- **Browser** (`src/lib/supabase/client.ts`): `createClient()` — synchronous, for `'use client'` components only
- **Server** (`src/lib/supabase/server.ts`): `await createClient()` — async, for Server Components/route handlers/actions
- **Always** use `supabase.auth.getUser()`, never `getSession()` on the server
- After login/logout, call `router.refresh()` to update Server Components
- `.insert()` with union type fields requires `as const` or explicit cast

### Tier System
Two tier systems coexist:
- **Global tier** (`src/lib/tier.ts`): `MembershipTier` = free | basic | pro | elite — stored in `members` table
- **Module tier** (`src/lib/modules.ts`): `ModuleTier` = free | basic | pro — stored in `module_subscriptions` table

### Layout Hierarchy
**Single Navbar everywhere**: One `Navbar` component (`src/components/layout/navbar.tsx`) is used on all pages. On public pages it renders centered (`max-w-7xl`). On module pages it renders full-width with a mobile hamburger menu (`showHamburger` prop). The hamburger dispatches a `'open-mobile-menu'` custom DOM event that `SidebarShell` listens for to open the mobile drawer.

Active modules use a `layout.tsx` inside the `(module)` route group (e.g., `src/app/hunting/(module)/layout.tsx`) that wraps sub-routes in `Navbar showHamburger` + `ModuleSidebar` + auth guard. The root page (`src/app/hunting/page.tsx`) sits outside this group and renders without a layout (public Nav2 page). Module layouts are created via `createModuleLayout()` in `src/lib/module-layout.tsx`.

### AI Framework (`src/lib/ai/`)
Layered guardrails system for all AI interactions:
- `aiCall()` — single entry point; handles rate limiting, input/output validation, audit logging, bronze-layer storage
- `guardrails.ts` — prompt injection detection, content filtering, rate limiting (10 req/min/user)
- `rules/base.rules.ts` — universal safety rules applied to all AI calls
- `rules/hunting.rules.ts`, `fitness.rules.ts`, `firearms.rules.ts` — module-specific rules
- System prompts are layered: base → module → feature-specific
- Rules files are server-only — never import in `'use client'` components
- JSON-returning features use `jsonOutput: true` which sends `output_config` for Anthropic structured output
- `extractJSON()` in `extract-json.ts` strips code fences and finds JSON objects as a fallback parser

### Data Architecture — Medallion Pattern
All raw external data sources follow **medallion architecture** (Bronze → Silver → Gold):
- **Bronze**: Raw data stored as-is for auditability and reprocessing. Never transformed, never deleted.
- **Silver**: Cleaned/parsed data ready for application use (e.g., parsed JSON plans in `fitness_training_plans.plan_data`)
- **Gold**: Aggregated/derived data for dashboards and analytics

Current bronze tables:
- `ai_responses` — every raw AI response with tokens, flags, parse success, and full response text
- When adding new external data sources (APIs, uploads, scrapes), always store the raw response in a bronze table first, then parse into silver

### Community System
Community feeds are **module-specific** — each module has its own isolated feed.
- `social_posts` table has a `module` column (default: `'hunting'`)
- `FeedPanel` component accepts a `module` prop to filter posts
- Post types: `discussion`, `unit_review`, `hunt_report`, `guide_review`
- API: `/api/community/posts` accepts `?module=` query param on GET, `module` field in POST body

### Field Map Feature
Map-first field map at `/hunting/field-map` using Leaflet.js:
- `field-map.tsx` — Direct Leaflet API usage (not react-leaflet), SSR-unsafe
- `field-map-dynamic.tsx` — `next/dynamic` wrapper with `ssr: false`
- 28 pin types across 6 groups (Sightings, Sign, Infrastructure, Terrain, Reference, Custom)
- Pin definitions: `src/lib/field-map/pin-types.ts`
- Thermal scent cone visualization: `src/lib/field-map/thermals.ts`
- Map tiles: USGS free (topo/satellite/hybrid) + BLM land boundaries overlay

### Key API Routes
- `/api/hunting/scout-data` — AI scout reports via `aiCall()` with Claude claude-sonnet-4-6
- `/api/hunting/field-map/conditions` — Open-Meteo weather + moon phase for pin auto-stamping
- `/api/hunting/field-map/terrain` — USGS 3DEP elevation for thermal slope/aspect calculation
- `/api/community/posts` — Module-scoped community feed CRUD
- `/api/contact` — Rate-limited contact form via Resend

### API Response Conventions

All API routes use helpers from `src/lib/api-response.ts` — no raw `NextResponse.json()`:

```typescript
import { apiOk, apiDone, apiError, unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api-response'
```

| Scenario | Helper | Shape | Status |
|---|---|---|---|
| GET single resource | `apiOk({ plan })` | `{ plan: T }` | 200 |
| GET list | `apiOk({ posts })` | `{ posts: T[] }` | 200 |
| GET paginated list | `apiOk({ users, total, page, limit })` | `{ users: T[], total, page, limit }` | 200 |
| POST create | `apiOk({ post }, 201)` | `{ post: T }` | **201** |
| POST action (no resource) | `apiDone()` | `{ ok: true }` | 200 |
| POST action with metadata | `apiDone({ sent: 5 })` | `{ ok: true, sent: 5 }` | 200 |
| PATCH/PUT update | `apiOk({ issue })` or `apiDone()` | `{ issue: T }` or `{ ok: true }` | 200 |
| DELETE | `apiDone()` | `{ ok: true }` | 200 |
| Error | `apiError('msg', 4xx)` | `{ error: string }` | 4xx/5xx |
| Toggle/check | `apiOk({ liked, count })` | `{ liked: boolean, ... }` | 200 |

**Module resource names** (use these as wrapper keys):

| Module | Singular | Plural |
|---|---|---|
| Community | `post`, `comment`, `friendship` | `posts`, `comments`, `friendships` |
| Fitness | `plan`, `workout`, `log`, `challenge`, `submission`, `test`, `share`, `item` | `plans`, `workouts`, `logs`, `challenges`, `submissions`, `tests`, `shares`, `items` |
| Hunting | `report`, `location`, `pin` | `reports`, `locations`, `pins` |
| Admin | `user`, `issue`, `deploy`, `broadcast` | `users`, `issues`, `deploys`, `broadcasts` |
| Messages | `message` | `messages` |
| Blog | `post` | `posts` |

## Design System

"Warm Wilderness" dark tactical theme defined in `src/app/globals.css` as CSS custom properties exposed via Tailwind `@theme`:
- Backgrounds: `bg-base` (#121210), `bg-surface`, `bg-elevated`
- Accent: `text-accent` / `bg-accent` (sage green #7c9a6e)
- Urgency: amber (#c4880c)
- Text: `text-primary` (#f0ece4), `text-secondary`, `text-muted`
- Borders: `border-subtle`, `border-default`, `border-strong`
- Use `cn()` from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Use `TacticalSelect` (`src/components/ui/tactical-select.tsx`) for all dropdowns

## Database

- **Types file**: `src/types/database.types.ts` — manually maintained. Use `{ [_ in never]: never }` for empty Update types
- **Migrations**: `supabase/migrations/0001_*.sql` through `0061_*.sql` — next migration is `0062`
- **Key schema notes**:
  - Profile tables split into three: `user_profile` (shared), `hunting_profile` (hunting-specific), `fitness_profile` (fitness-specific)
  - `user_profile` uses `id = auth.uid()` as PK; `hunting_profile` and `fitness_profile` FK → `user_profile.id`
  - Profile column names: `email` (was backup_email), `city` (was home_city), `state` (was residency_state), `country` (new), `created_on`/`updated_on` (was created_at/updated_at)
  - `my_friends` view has `security_invoker=true` — must have `Relationships: []` in database.types.ts
  - `hunting_field_map_pins` stores pin_type, lat/lng, label, notes, metadata JSONB, and auto-stamped weather conditions
  - `social_posts` has a `module` column for module-scoped feeds
  - Most tables use `ON DELETE CASCADE` from `auth.users` — deleting a user cascades all data

## Testing

Vitest + jsdom. Setup at `src/test/setup.ts` (includes ResizeObserver polyfill for Leaflet tests). Tests live alongside source in `__tests__/` directories. 273 tests passing across 8 test files.

## Key Gotchas

- `useSearchParams()` must be in a component wrapped by `<Suspense>` (Next.js 16+)
- String form fields passed to Supabase typed columns need explicit cast: `(form.hunt_type) as HuntType | null`
- Leaflet `L.polygon` uses `[lat, lng]` order (not GeoJSON's `[lng, lat]`)
- Do not use `module` as a variable name in Next.js files — it conflicts with the reserved `module` global. Use `postModule`, `moduleSlug`, etc.
