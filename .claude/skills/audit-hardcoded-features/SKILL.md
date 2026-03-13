---
name: audit-hardcoded-features
description: Scan code for hardcoded values (colors, strings, numbers, patterns) that should be unified into design tokens, shared constants, utility classes, or shared components.
argument-hint: "[colors | strings | patterns | all] [module-name]"
user-invocable: true
---

Audit: Hardcoded Features — Find hardcoded values scattered across the codebase that should be extracted into shared abstractions.

Arguments: $ARGUMENTS
(Optional — scope by category: "colors", "strings", "patterns", or "all" (default). Optionally add a module name to scope to that module only, e.g. "colors fitness".)

## Your Task

Scan module pages (`src/app/*/\(module\)/**`) and shared components (`src/components/`) for hardcoded values that bypass the design system, duplicate magic strings, or repeat identical UI patterns. Identify candidates for extraction into design tokens, shared constants, utility classes, or shared components.

Do NOT scan:
- `src/app/fitness-mockup/` (temp mockup)
- Public/Nav2 pages (root `page.tsx` files outside `(module)` route groups)
- `src/app/globals.css` (the design system itself)
- `node_modules/`, `.next/`, test files

## Categories

### 1. Hardcoded Colors

**Raw hex in className:**
- `bg-[#...]`, `text-[#...]`, `border-[#...]` — should use design tokens (`bg-accent`, `text-urgency`, etc.)

**Tailwind named colors bypassing tokens:**
- `text-red-400`, `bg-amber-900/40`, `text-green-400`, `text-blue-400`, `text-purple-400`, etc.
- Cross-reference with existing tokens in `globals.css` — if a token exists (e.g., `--accent`, `--amber`, `--error`, `--success`), the Tailwind named color should use the token instead
- Flag repeated color combos used in 3+ files as candidates for new tokens or utility classes

**Inline style colors:**
- `style={{ color: '#...', background: '...', backgroundColor: '...' }}`
- `rgba(...)` values in inline styles
- SVG attributes: `fill="#..."`, `stroke="#..."`

**Leaflet/third-party CSS overrides:**
- `<style>` blocks with hardcoded colors for Leaflet popups, markers, etc.
- Lower priority — these are harder to tokenize but should still be flagged

### 2. Hardcoded Strings

**Repeated UI copy:**
- Identical error messages, empty states, disclaimers, or labels appearing in 3+ files
- Example: "AI-generated plans are general guidance..." disclaimer

**Magic API paths:**
- Repeated `fetch('/api/...')` URL strings that should be constants

**Repeated Tailwind class combos:**
- The same long class string (>40 chars) appearing in 3+ files — candidate for a utility class or shared component
- Example: `"bg-red-950/50 border border-red-500/30 text-red-400"` error banner pattern

### 3. Hardcoded Patterns (Repeated UI Logic)

**Repeated UI patterns:**
- Identical card/banner/badge structures (JSX + classes) copy-pasted across files
- Example: error banners, status badges (applied/pending/cancelled), scaling badges (RX/scaled/beginner)
- For each pattern found in 3+ files, recommend extracting to a shared component

**Repeated color maps:**
- Objects mapping status/type → color classes duplicated across files
- Example: run type color map (easy=green, tempo=amber, interval=red) in `weekly-preview.tsx` and `plan-table-view.tsx`

**Repeated conditional color logic:**
- The same ternary or conditional choosing colors based on a value, duplicated across files
- Example: `quota > 80 ? 'text-red-500' : quota > 50 ? 'text-amber-500' : 'text-accent'`

### 4. Magic Numbers

- Hardcoded numeric values that should be named constants
- Examples: rate limits, pagination sizes, timeout durations, max lengths
- Only flag if the same number appears in 2+ files for the same purpose

## Steps

### 1. Search for patterns

Use Grep to systematically search for each pattern category. Run searches in parallel where possible.

Key search patterns:
- `bg-\[#` / `text-\[#` / `border-\[#` — raw hex in className
- `text-(red|amber|green|blue|purple|orange|cyan|teal|emerald|violet|indigo|pink|rose|lime|fuchsia|sky)-` — Tailwind named colors
- `style=\{\{.*color` / `style=\{\{.*background` — inline style colors
- `fill="#` / `stroke="#` — SVG hardcoded colors
- `rgba\(` — rgba in inline styles or class strings
- Repeated long class strings across files

### 2. Cross-reference with design system

Read `src/app/globals.css` to understand existing tokens. For each hardcoded color found:
- Does a design token already exist? → Flag as "should use token"
- Is this a new semantic color used in 3+ places? → Recommend creating a new token
- Is this a one-off color used once? → Low priority, note but don't flag

### 3. Group findings

Group by extraction opportunity:
- **Token candidates**: Colors used semantically in 3+ files → add to `globals.css`
- **Utility class candidates**: Repeated class combos in 3+ files → add to globals or a utility layer
- **Shared component candidates**: Repeated JSX+class patterns → extract component to `src/components/ui/`
- **Constant candidates**: Repeated strings/numbers → extract to a constants file or shared module

### 4. Output the report

```
## Hardcoded Features Audit — <date>

### Summary
- Files scanned: X
- Hardcoded colors found: X (X using existing tokens incorrectly, X needing new tokens)
- Repeated patterns found: X
- Magic strings/numbers found: X

### Token Mismatches (existing token not used)
| Hardcoded Value | Should Be | Files |
|----------------|-----------|-------|
| `text-[#7c9a6e]` | `text-accent` | shot-waveform.tsx |
| ... | ... | ... |

### New Token Candidates
| Pattern | Proposed Token | Usage Count | Files |
|---------|---------------|-------------|-------|
| `text-red-400` (errors) | `--error` (exists) → use `text-error` | 15 | 10+ |
| `text-green-400` (success) | `--success` (exists) → use `text-success` | 12 | 8+ |
| ... | ... | ... | ... |

### Utility Class Candidates
| Class Combo | Proposed Name | Usage Count |
|-------------|--------------|-------------|
| `bg-red-950/50 border border-red-500/30 text-red-400` | `.error-banner` | 10+ |
| ... | ... | ... |

### Shared Component Candidates
| Pattern | Proposed Component | Files | Props Needed |
|---------|-------------------|-------|-------------|
| Error banner div | `<ErrorBanner message={...} />` | 10+ | `message: string` |
| Status badge | `<StatusBadge status={...} />` | 8+ | `status: string` |
| ... | ... | ... | ... |

### Repeated Color Maps
| Map Purpose | Files | Recommendation |
|-------------|-------|----------------|
| Run type colors | weekly-preview.tsx, plan-table-view.tsx | Extract to shared constant |
| ... | ... | ... |

### Low Priority (One-off or Third-party)
- Leaflet CSS overrides in field-map.tsx, location-scout-map.tsx
- SVG-specific fills/strokes that can't use Tailwind
```

## Severity Classification

- **P0 — Token mismatch**: A design token exists but the hardcoded value is used instead. Always fix.
- **P1 — High duplication**: Same hardcoded pattern in 5+ files. Extract immediately.
- **P2 — Moderate duplication**: Same pattern in 3-4 files. Extract when touching those files.
- **P3 — Low / intentional**: One-off values, SVG attributes, third-party overrides. Note for awareness.

## Rules

- Read `globals.css` first to know what tokens exist before flagging
- Always report file paths and line numbers
- Group by extraction opportunity, not just by occurrence
- Don't flag Tailwind's `text-white`, `text-black`, `bg-transparent`, `bg-white` — these are universal
- Don't flag colors inside `globals.css` or design system definition files
- If `$ARGUMENTS` scopes to a module (e.g., "fitness"), only scan that module's `(module)/` pages and components in `src/components/<module>/`
- If `$ARGUMENTS` is "colors", only run the color-related checks
- If `$ARGUMENTS` is "strings", only run the string/copy checks
- If `$ARGUMENTS` is "patterns", only run the repeated pattern checks
- Present the most impactful fixes first — biggest duplication count wins
