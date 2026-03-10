---
name: cleanup-repo
description: Audit the repository for abandoned, orphaned, or dead files and clean them up.
argument-hint: "[dry-run | fix]"
---

Audit the repository for abandoned, orphaned, or dead files and clean them up.

Arguments: $ARGUMENTS
(Optional — "dry-run" to report only without deleting, "fix" to delete confirmed orphans. Defaults to "dry-run".)

## Your Task

Scan the entire codebase for files that are no longer referenced, imported, or routed to. Produce a structured report of orphaned files, then delete confirmed orphans if in "fix" mode.

## Architecture Context

### Route Structure
This app uses Next.js App Router with a specific pattern:

1. **Public module pages**: `src/app/{module}/page.tsx` — static landing pages, one per module (hunting, archery, firearms, fishing, fitness, medical)
2. **Route groups**: `src/app/{module}/(module)/` — authenticated pages wrapped in a shared layout with sidebar
3. **Account pages**: `src/app/account/profile/page.tsx`, `src/app/account/subscriptions/page.tsx` — standalone authenticated pages
4. **Shared components**: Some components are used across multiple modules:
   - `src/components/profile/profile-page.tsx` — shared by ALL module profile pages AND `/account/profile`
   - `src/components/layout/navbar.tsx` — used on all public pages and account pages
   - `src/components/layout/account-dropdown.tsx` — used within Navbar when logged in
   - `src/components/layout/module-sidebar.tsx` — used in all `(module)/layout.tsx` files
   - `src/components/pricing/tier-cards.tsx` — auth-aware pricing cards on `/pricing`

### Re-export Pattern
Module profile pages use re-exports and are NOT orphaned:
```ts
export { default } from '@/components/profile/profile-page'
```
These 1-line files are intentional — they render the shared profile within each module's sidebar layout.

### Redirects
`next.config.ts` has permanent redirects (e.g., `/dashboard` → `/modules`). Pages at redirect sources are legacy.

## Steps

### 1. Build the active file graph

**Routes:**
- Glob `src/app/**/page.tsx` and `src/app/**/layout.tsx` — these are active route files
- Note: `(module)` directories are route groups — they don't appear in the URL but ARE valid route directories
- Read `next.config.ts` for redirects — any route that redirects TO a destination means the source route is legacy
- Read `middleware.ts` for route arrays (PUBLIC_ROUTES, PUBLIC_MODULE_ROOTS, BASIC_REQUIRED_ROUTES)
- Flag any `page.tsx` that exists in a directory for a route that is now redirected elsewhere

**Imports:**
- For every active route file, trace its imports recursively:
  - `@/components/*` — which components are actually used?
  - `@/lib/*` — which utilities are actually imported?
  - `@/types/*` — which types are referenced?
- Build a set of "referenced files" from this import graph
- Note: Re-export files (`export { default } from '...'`) count as importing their source

**API Routes:**
- Glob `src/app/api/**/route.ts` — these are active API endpoints
- Check if any API route is called from the codebase (grep for its path)
- Flag API routes that are never referenced from any page or component

### 2. Find orphaned components

Glob `src/components/**/*.tsx`. For each component file:
- Grep the entire `src/` directory for its export name or file path
- If no file imports it, mark as ORPHANED
- Exception: components in `src/components/ui/` that might be used dynamically — flag as REVIEW instead of ORPHANED
- Exception: `profile-page.tsx` is imported via re-export pattern — verify ALL module `(module)/profile/page.tsx` files reference it

### 3. Find orphaned lib files

Glob `src/lib/**/*.ts` (excluding `__tests__/`). For each lib file:
- Grep for its exports being imported anywhere in `src/`
- If nothing imports it, mark as ORPHANED
- Exception: files that are barrel exports (`index.ts`) — check if the barrel itself is imported

### 4. Find orphaned test files

Glob `src/**/__tests__/**/*.test.ts` and `src/**/__tests__/**/*.test.tsx`. For each test:
- Does the file it tests still exist? (e.g., `tier.test.ts` → `tier.ts`)
- If the source file is orphaned, the test is also orphaned

### 5. Find abandoned route directories

Look for route directories that:
- Have a `page.tsx` but are redirected away in `next.config.ts`
- Have a `page.tsx` that just re-exports or redirects to another page (re-exports within `(module)/` route groups are VALID — do not flag these)
- Contain only a `layout.tsx` with no child `page.tsx`

### 6. Find duplicate / redundant files

- Check for files with very similar names (e.g., `sidebar.tsx` and `module-sidebar.tsx`)
- Check for multiple implementations of the same concept
- Check if legacy dashboard pages exist alongside new module pages

### 7. Check for unused assets

- Glob `public/**/*` for images, fonts, etc.
- Grep `src/` for references to each public asset filename
- Flag assets not referenced anywhere

### 8. Check for unused dependencies

- Read `package.json` dependencies
- For each dependency, grep `src/` and config files for its import
- Flag dependencies that are never imported (but note: some are used implicitly by frameworks)
- Skip: `next`, `react`, `react-dom`, `typescript`, `@types/*`, `tailwindcss`, `postcss`, `vitest`, `eslint`, `@eslint/*`

### 9. Check for stale mock data

- Glob `mock/**/*` and `src/**/mock*` and `src/**/seed*`
- Are mock files referenced in tests or dev scripts?
- Flag mock files that aren't imported anywhere

## Output

```
## Repo Cleanup Report — <date>

### Orphaned Files (safe to delete)
| # | File | Type | Reason |
|---|------|------|--------|
| 1 | src/app/modules/page.tsx | Route | Redirected to /hunting in next.config.ts |
| 2 | src/components/layout/old-sidebar.tsx | Component | Not imported anywhere |
| ... | ... | ... | ... |

### Review Needed (might be orphaned)
| # | File | Type | Concern |
|---|------|------|---------|
| 1 | src/components/ui/some-widget.tsx | Component | Only imported in orphaned page |
| ... | ... | ... | ... |

### Unused Dependencies
| Package | Imported Anywhere? | Recommendation |
|---------|-------------------|----------------|
| some-pkg | No | Remove |
| ... | ... | ... |

### Unused Assets
| File | Referenced? | Size |
|------|------------|------|
| public/images/old-logo.png | No | 450KB |
| ... | ... | ... |

### Redirect-Only Routes (legacy)
| Route | Redirects To | Has page.tsx? | Action |
|-------|-------------|---------------|--------|
| /dashboard | /hunting | Yes (legacy) | Delete page.tsx |
| ... | ... | ... | ... |

### Summary
- Orphaned files: X (Y KB total)
- Files needing review: X
- Unused dependencies: X
- Unused assets: X

### Recommended Cleanup Commands
(Only shown in dry-run mode)
```bash
# Delete orphaned files
rm src/app/modules/page.tsx
rm src/components/layout/old-sidebar.tsx
# ...

# Remove unused dependencies
npm uninstall some-pkg
```

### Files Deleted (fix mode only)
| File | Size | Reason |
|------|------|--------|
| ... | ... | ... |
```

## Rules
- NEVER delete without verifying. Grep for every export, every filename, every import path.
- In "dry-run" mode (default), only report — do not delete anything
- In "fix" mode, only delete files marked ORPHANED (not REVIEW)
- NEVER delete: `CLAUDE.md`, `.env*`, `package.json`, `tsconfig.json`, config files, migration files, test setup files
- NEVER delete migration SQL files — even if they reference tables that were later altered
- NEVER delete `.claude/` directory contents
- NEVER delete `(module)/profile/page.tsx` files — they are intentional 1-line re-exports, not orphans
- NEVER delete `(module)/layout.tsx` files — they provide auth guards and sidebar wrapping
- Before deleting in fix mode, run `npm run build` to verify the build still passes after each batch of deletions
- If a component is only imported by an orphaned page, mark BOTH as orphaned
- Consider that some files may be imported dynamically (via `import()` or `require()`) — grep for the filename too, not just the export
- Mock data files used in tests should NOT be deleted even if not imported in production code
- After cleanup, run tests to verify nothing broke
