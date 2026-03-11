---
name: audit-editor
description: Run a content and UI audit across user-facing pages, checking for copy mistakes, wording improvements, and visual consistency.
argument-hint: "[route | fix | copy-only | ui-only]"
user-invocable: false
---

Run a content and UI audit across user-facing pages, checking for copy mistakes, wording improvements, and visual consistency.

Arguments: $ARGUMENTS
(Optional — a route like "/hunting/gear" to scope to one page, "fix" to auto-apply changes, or "copy-only" / "ui-only" to limit scope. Defaults to full audit of all pages.)

## Your Task

Review every user-facing page for content quality (typos, grammar, awkward phrasing, inconsistent terminology) and UI polish (spacing, alignment, color consistency, responsive issues, missing states). Output a structured report with actionable fixes.

## Architecture Context

This app has three categories of pages — audit rules differ by category:

### Category 1 — Public pages (static, no auth)
Routes: `/`, `/pricing`, `/about`, `/newsletter`, `/spearfishing`, `/auth/*`
These are in `PUBLIC_ROUTES` in `middleware.ts`. Purely static — no auth imports.

### Category 2 — Public module root pages (static landing pages)
Routes: `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`
Each is a standalone marketing page. They use `Navbar` (client-side auth-aware) and `Nav2` (module navigation bar).
**CRITICAL**: These MUST remain pure static — never add auth imports. Audit for copy/UI only.
Each has two CTA buttons: "Get Started" → `/auth/signup` and "Access [Module] Module" → module dashboard.

### Category 3 — Authenticated pages
**Module pages** under `src/app/{module}/(module)/` — wrapped in `ModuleSidebar` layout.
**Account pages** at `/account/profile` and `/account/subscriptions` — standalone pages with `Navbar`.
**Shared profile component**: `src/components/profile/profile-page.tsx` — used by ALL module profile pages AND `/account/profile`.

### Key shared components
- `Navbar` (`src/components/layout/navbar.tsx`) — shows `AccountDropdown` when logged in, "Log In" when not
- `AccountDropdown` (`src/components/layout/account-dropdown.tsx`) — avatar, name, tier badge, profile card, links to My Modules / Edit Profile / Subscriptions / Sign Out
- `Nav2` (`src/components/layout/nav2.tsx`) — horizontal module navigation bar on public pages
- `ModuleSidebar` (`src/components/layout/module-sidebar.tsx`) — vertical sidebar inside module dashboards
- `TacticalSelect` (`src/components/ui/tactical-select.tsx`) — all dropdowns should use this
- `TierCards` (`src/components/pricing/tier-cards.tsx`) — auth-aware pricing cards on `/pricing`

## Steps

### 1. Resolve scope

If `$ARGUMENTS` contains a route path, audit only that page and its components.
If `$ARGUMENTS` contains "copy-only", skip UI checks. If "ui-only", skip copy checks.
If `$ARGUMENTS` is empty, audit all pages under `src/app/`.

### 2. Discover pages and components

**Mandatory file checklist — ALWAYS check these files first (ensures consistent coverage):**
- `src/app/page.tsx` — landing page (footer, CTAs, module grid)
- `src/app/newsletter/page.tsx` — CTA label vs actual behavior
- `src/app/blog/page.tsx` — placeholder content expectations
- `src/app/about/page.tsx` — metadata titles
- `src/app/spearfishing/page.tsx` — hero image relevance
- `src/components/layout/nav2.tsx` — "Command Center" label
- `src/components/layout/dashboard-sidebar.tsx` — "Overview" label (should match Nav2)
- `src/components/layout/public-footer.tsx` — footer link consistency
- `src/app/onboarding/page.tsx` — selection colors, placeholder text
- `src/app/auth/signup/page.tsx` — confirmation checkmark style
- `src/app/auth/forgot-password/page.tsx` — confirmation checkmark style
- `src/app/hunting/(module)/gear/page.tsx` — progress bar contrast, subtitle
- `src/app/hunting/(module)/applications/page.tsx` — rejection note accuracy
- `src/app/hunting/(module)/ai-assistant/page.tsx` — heading vs sidebar naming
- `src/app/account/subscriptions/page.tsx` — hardcoded prices
- `src/lib/factories/create-nav2-page.tsx` — Nav2 factory heading conventions

Glob for `src/app/**/page.tsx` (and layout files if relevant). For each page, also identify imported components from `src/components/` that render visible text or UI.

Note: Module profile pages are re-exports (`export { default } from '@/components/profile/profile-page'`). Audit the shared component, not each re-export.

### 3. Audit copy and content

For every page and component with user-facing text, check:

**Spelling & Grammar:**
- Typos, misspellings, doubled words
- Subject-verb agreement
- Missing or misplaced punctuation
- Sentence fragments that read awkwardly

**Wording & Clarity:**
- Jargon or technical terms that could confuse users
- Vague CTAs ("Click here" vs "Start your hunt plan")
- Passive voice where active would be clearer
- Overly long labels, descriptions, or helper text that could be tightened
- Placeholder text or TODOs left in the UI

**Consistency:**
- Same concept referred to by different names (e.g., "hunt plan" vs "hunt" vs "trip")
- Inconsistent capitalization (Title Case vs sentence case for headings, buttons, labels)
- Inconsistent punctuation in lists (some with periods, some without)
- Date/number formatting inconsistencies
- Tone shifts (formal in one place, casual in another)
- Module naming consistency — each module should use the same name everywhere (Navbar, Nav2, sidebar, page headings, CTA buttons)

**Microcopy:**
- Empty states — are they helpful or just blank?
- Error messages — are they actionable?
- Loading states — do they tell the user what's happening?
- Confirmation messages — do they confirm what happened?
- Button labels — are they specific enough?
- Tooltips / helper text — are they actually helpful?
- Account dropdown — does text match page headings?

### 4. Audit look and feel

For every page, read the JSX and Tailwind classes to check:

**Spacing & Layout:**
- Inconsistent padding/margins between similar components
- Sections that feel too spacious or too cramped relative to the rest of the page
- Inconsistent use of `gap-*`, `space-y-*`, `mb-*` values across similar layouts
- Content that doesn't align with adjacent elements

**Typography:**
- Inconsistent heading sizes for the same level of hierarchy
- Text sizes that don't match the design system (`text-xs`, `text-sm`, `text-base` used inconsistently)
- Font weight inconsistencies for similar elements
- Line height issues (text feeling too tight or too loose)

**Colors & Theme:**
- Colors that don't match the design system tokens (hardcoded hex vs `text-primary`, `bg-surface`, etc.)
- Inconsistent use of accent, muted, secondary colors for similar element types
- Hover/focus states missing or inconsistent
- Status colors used inconsistently (success=green, warning=amber, error=red)
- Module accent colors — some modules use `blue-400`, others use `accent` — should be intentional

**Components & Patterns:**
- Similar UI patterns implemented differently across pages (e.g., cards, lists, badges)
- Missing hover states on interactive elements
- Buttons without disabled states during loading/saving
- Inconsistent icon sizes or icon + text alignment
- Dropdowns that should use `TacticalSelect` but don't
- Account dropdown profile card vs profile page — do they show consistent info?

**Responsive:**
- Grid breakpoints that differ across similar pages
- Elements that likely overflow or stack awkwardly on mobile (long text, wide tables)
- Touch targets too small on mobile (`< 44px`)

**States:**
- Loading states that are plain text vs skeleton vs spinner (should be consistent)
- Empty states that are just blank space vs having a message/CTA
- Error states that are missing or inconsistent
- Disabled states that don't look different from enabled

### 5. Cross-page consistency check

Compare across all audited pages:
- Page header pattern (icon + title + subtitle — is it the same layout everywhere?)
- Card style (same border radius, padding, background?)
- Button styles (primary, secondary, ghost — used consistently?)
- Section spacing rhythm (does every page "feel" like the same app?)
- Public module pages — do they all follow the same structure? (hero → description → features → CTA)
- Module dashboards — do sidebar nav items, page headers, and content layouts match?
- Account pages vs module pages — consistent header pattern with Navbar?

## Output

```
## Content & UI Audit — <date>

### Copy Issues
| # | Page/Component | Location | Issue | Severity | Suggested Fix |
|---|----------------|----------|-------|----------|---------------|
| 1 | /hunting/gear | Page subtitle | "Check off gear you own" — could be more motivating | LOW | "Track your gear — check items you own, see what you still need" |
| 2 | ... | ... | ... | ... | ... |

### Consistency Issues
| # | Issue | Locations | Suggested Standard |
|---|-------|-----------|-------------------|
| 1 | "hunt plan" vs "hunt" vs "trip" used interchangeably | /hunting/hunts, /hunting/gear | Standardize on "hunt plan" |
| 2 | ... | ... | ... |

### UI Issues
| # | Page/Component | Element | Issue | Severity | Fix |
|---|----------------|---------|-------|----------|-----|
| 1 | /hunting/deadlines | State cards | gap-4 but /hunting/gear uses gap-3 for similar cards | LOW | Align to gap-3 |
| 2 | ... | ... | ... | ... | ... |

### Missing States
| Page | Loading | Empty | Error | Notes |
|------|---------|-------|-------|-------|
| /hunting/gear | "Loading..." text | N/A | None | Add error handling |
| ... | ... | ... | ... | ... |

### Summary
- Critical (blocks UX): X
- High (noticeable to users): X
- Medium (polish): X
- Low (nitpick): X

### Priority Fixes
1. **[HIGH]** [Description and fix]
2. **[MEDIUM]** [Description and fix]
3. ...

### Files Modified (if "fix" mode)
| File | Changes |
|------|---------|
| ... | ... |
```

## Rules
- Read every file fully — do not skim or assume content from file names
- Focus on what a real user would notice, not developer preferences
- Every finding must include a specific suggested fix, not just "improve this"
- Severity levels:
  - CRITICAL: Broken UX, missing critical info, misleading content
  - HIGH: Noticeable to most users, hurts perceived quality
  - MEDIUM: Polish issue, inconsistency that subtly degrades experience
  - LOW: Nitpick, minor wording preference, slight inconsistency
- When suggesting wording changes, match the existing tone (tactical/outdoor, confident, concise)
- Do not suggest adding features — only audit what exists
- If "fix" mode, apply all HIGH and CRITICAL fixes automatically, list MEDIUM/LOW for review
- Respect the "Warm Wilderness" design system — check against CSS custom properties in globals.css
- Check `TacticalSelect` usage — all dropdowns should use it per CLAUDE.md
- For copy, prefer active voice, specific verbs, and concise phrasing
- **NEVER add auth imports to public module root pages** — if a copy fix requires dynamic content, find another way or flag it as needing middleware handling
