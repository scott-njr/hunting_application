---
name: audit-cell
description: Run a mobile responsiveness audit across all pages, components, and layouts to catch non-responsive patterns.
argument-hint: "[route-prefix | fix | verbose]"
user-invocable: false
---

Run a mobile responsiveness audit across all pages, components, and layouts to catch non-responsive patterns before deployment.

Arguments: $ARGUMENTS
(Optional — a route prefix like "/hunting" to scope, "fix" to auto-apply fixes, or "verbose" for extra detail. Defaults to full audit.)

## Your Task

Systematically scan the codebase for mobile responsiveness anti-patterns — fixed widths without breakpoints, grids without responsive variants, overflow risks, touch target issues, and missing mobile layouts. Output a structured report with severity levels and actionable fixes.

## Steps

### 1. Resolve scope

If `$ARGUMENTS` contains a route prefix, scope to pages/components under that area only.
If `$ARGUMENTS` is empty, audit all pages and components.

### 2. Audit layouts for mobile support

**Mandatory file checklist — ALWAYS read these files first (ensures consistent coverage):**
- `src/app/globals.css` — `.nav-link` touch targets, `.input-field` font-size
- `src/components/layout/navbar.tsx` — Login button size
- `src/components/layout/nav2.tsx` — Nav2 link touch targets
- `src/components/layout/account-dropdown.tsx` — dropdown width overflow
- `src/components/layout/module-sidebar.tsx` — sidebar responsive behavior
- `src/components/pricing/tier-cards.tsx` — tier button grid on mobile
- `src/components/fitness/coach/plan-compare-detail.tsx` — side-by-side comparison grid
- `src/components/fitness/coach/challenges-inbox.tsx` — scaling button touch targets
- `src/components/fitness/coach/share-item-button.tsx` — friend selection grid
- `src/components/community/feed-panel.tsx` — reaction/comment touch targets
- `src/components/field-map/side-panel.tsx` — map side panel height
- `src/components/auth/auth-modal.tsx` — modal padding on mobile
- `src/app/auth/login/page.tsx` — login card padding
- `src/app/auth/signup/page.tsx` — signup card padding
- `src/app/onboarding/page.tsx` — onboarding card padding
- `src/app/contact/page.tsx` — contact form padding
- `src/app/dashboard/page.tsx` — dashboard heading size
- `src/app/admin/users/page.tsx` — pagination touch targets
- `src/app/fitness/(module)/my-plan/page.tsx` — stat card grids
- `src/components/hunts/share-hunt-modal.tsx` — modal touch targets

Glob for `src/app/**/layout.tsx`. For each layout:

- Does the main content area have responsive padding? (needs `px-4` or similar at mobile, scaling up with `sm:`, `lg:`)
- Does the layout account for mobile top bar offset? (needs `pt-16` or similar on mobile when a fixed header exists)
- Is `min-w-0` set on flex children to prevent overflow?
- Does the layout use `100dvh` instead of `100vh`? (dvh handles mobile browser chrome)

### 3. Audit pages for responsive grids and flex layouts

Glob for `src/app/**/page.tsx`. For each page:

**Grid anti-patterns:**
- `grid-cols-N` (where N > 1) without `sm:`, `md:`, or `lg:` breakpoint variants — content will be cramped on mobile
- Should be `grid-cols-1` at base, then `sm:grid-cols-2`, `lg:grid-cols-3`, etc.

**Flex anti-patterns:**
- `flex-row` without `flex-col` at mobile — side-by-side layouts will squish on small screens
- Should be `flex flex-col lg:flex-row` for two-panel layouts

**Fixed width anti-patterns:**
- `w-[Npx]` or `w-NN` (e.g. `w-96`, `w-80`) without responsive hiding or stacking
- Sidebar-style elements should be `hidden lg:block w-80` or similar

**Overflow risks:**
- Tables without `overflow-x-auto` wrapper
- Pre/code blocks without `overflow-x-auto`
- Long text without `break-words` or `truncate`

### 4. Audit components for responsive patterns

Glob for `src/components/**/*.tsx`. For each component:

**Touch targets:**
- Buttons and interactive elements smaller than 44x44px (minimum tap target)
- `p-1` or `p-0.5` on clickable elements — should be at least `p-2` or use `min-h-[44px] min-w-[44px]`

**Text sizing:**
- `text-4xl` or larger headings without smaller mobile variants (`text-2xl sm:text-4xl`)
- Long headings that might wrap awkwardly on mobile

**Spacing:**
- `gap-8` or larger without mobile reduction (`gap-4 sm:gap-8`)
- `p-8` or `px-8` without mobile variants (`p-4 sm:p-8`)

**Visibility patterns:**
- Complex data displays (tables, multi-column layouts) without mobile alternatives
- Should use `hidden sm:grid` for desktop table + mobile card layout, or `overflow-x-auto`

### 5. Audit sidebar and navigation

Read `src/components/layout/module-sidebar.tsx` and any other nav components:

- Is there a mobile hamburger menu / drawer pattern?
- Does the sidebar hide on mobile (`hidden lg:flex`)?
- Is there a mobile top bar with essential nav?
- Does the drawer auto-close on route navigation?
- Is body scroll locked when drawer is open?

Also audit:
- `Navbar` (`src/components/layout/navbar.tsx`) — does the `AccountDropdown` work on mobile? Check dropdown width vs screen width.
- `AccountDropdown` (`src/components/layout/account-dropdown.tsx`) — `w-72` fixed width dropdown — does it fit on small screens?
- `Nav2` (`src/components/layout/nav2.tsx`) — horizontal module bar — does it scroll/overflow on mobile with 6+ module links?
- Account pages (`/account/profile`, `/account/subscriptions`) — standalone pages with Navbar, no sidebar — responsive layout?

### 6. Audit images and media

Grep for `<img`, `<Image`, `<video`, `<iframe`:

- Do images have responsive width (`w-full`, `max-w-full`)?
- Are aspect ratios maintained (`aspect-square`, `aspect-video`, `object-cover`)?
- Do iframes/embeds have responsive wrappers?

### 7. Audit forms and inputs

Grep for `<input`, `<select`, `<textarea`, `TacticalSelect`:

- Are form fields full-width on mobile (`w-full`)?
- Are form layouts responsive (stacked on mobile, side-by-side on desktop)?
- Do input fields have appropriate `text-base` or `text-[16px]` to prevent iOS zoom on focus?

### 8. Audit modals and overlays

Grep for `fixed`, `absolute`, `z-`:

- Do modals use `max-h-[90vh]` or similar to prevent overflow on mobile?
- Are fixed/absolute positioned elements properly constrained?
- Do overlays account for mobile safe areas?

## Output

```
## Mobile Responsiveness Audit — <date>

### Critical Issues (Breaks on Mobile)
| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | src/app/hunting/page.tsx:45 | `grid-cols-3` without mobile fallback | Change to `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| 2 | ... | ... | ... |

### High Issues (Poor Mobile UX)
| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | src/components/ui/card.tsx:12 | Heading `text-5xl` without mobile sizing | Add `text-3xl sm:text-5xl` |
| 2 | ... | ... | ... |

### Medium Issues (Suboptimal but Functional)
| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | src/components/journal/side-panel.tsx:8 | `gap-8` without mobile reduction | Change to `gap-4 sm:gap-8` |
| 2 | ... | ... | ... |

### Low Issues (Minor Polish)
| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | ... | ... | ... |

### Navigation
| Check | Status | Notes |
|-------|--------|-------|
| Mobile hamburger menu | OK/MISSING | ... |
| Sidebar hidden on mobile | OK/MISSING | ... |
| Mobile top bar | OK/MISSING | ... |
| Drawer auto-close on navigate | OK/MISSING | ... |
| Body scroll lock on drawer | OK/MISSING | ... |

### Pages Scanned
| Page | Grid Safe | Flex Safe | Padding Safe | Overflow Safe | Status |
|------|-----------|-----------|-------------|--------------|--------|
| /hunting/page.tsx | YES | YES | YES | YES | PASS |
| /hunting/profile/page.tsx | YES | NO | YES | YES | NEEDS FIX |
| ... | ... | ... | ... | ... | ... |

### Summary
- Critical: X (layout breaks on mobile)
- High: X (poor usability on mobile)
- Medium: X (suboptimal but functional)
- Low: X (minor polish items)

### Priority Fixes
1. **[CRITICAL]** [Description and fix]
2. **[HIGH]** [Description and fix]
3. ...

### Files Modified (if "fix" mode)
| File | Changes |
|------|---------|
| ... | ... |
```

## Rules
- Read every page and layout file — do not assume responsiveness from file names
- Every finding must include the file path with line number and a specific Tailwind fix
- CRITICAL: Layout completely breaks on mobile (content overflows, unreadable, unusable)
- HIGH: Usable but poor experience (tiny tap targets, cramped text, no mobile alternative for complex UI)
- MEDIUM: Functional but suboptimal (oversized spacing, minor overflow, could be better)
- LOW: Polish items (slightly large gaps, could use mobile-specific tweaks)
- Always recommend the mobile-first approach: base classes for mobile, then `sm:`, `md:`, `lg:` for larger screens
- If "fix" mode, only apply safe CSS/Tailwind changes — never modify component logic, data fetching, or state management
- Check both pages (`src/app/`) AND shared components (`src/components/`)
- Pay special attention to data tables, forms, and multi-column layouts — these are the most common mobile offenders
- The app uses Tailwind CSS with these breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- The sidebar uses `lg:` as its breakpoint — all page layouts should be mobile-friendly below `lg:` (1024px)
