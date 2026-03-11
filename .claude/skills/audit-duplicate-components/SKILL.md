---
name: audit-duplicate-components
description: Detect duplicated UI components that should be shared. Use when checking for redundant component implementations.
argument-hint: "[verbose | component-dir]"
user-invocable: false
---

Audit: Duplicate Components — Detect UI components with near-identical implementations that should be extracted into shared components.

Arguments: $ARGUMENTS
(Optional — "verbose" for extra detail or a specific directory path to scope the audit.)

## Your Task

Find components across the codebase that contain duplicated UI patterns — the same markup, styles, and logic repeated in multiple files. These should be extracted into shared components to prevent bugs where a fix in one copy is missed in the other.

## Why This Matters

Duplicated components create maintenance nightmares. When a bug is found (e.g., a missing link), it must be fixed in every copy. If one copy is missed, users on certain pages still see the bug. Shared components ensure a single source of truth.

## Steps

### 1. Identify candidate patterns

Search for these common duplication signals across `src/components/` and `src/app/`:

- **Identical class strings**: Find components with the same long Tailwind class strings (>30 chars) appearing in multiple files
- **Identical JSX structures**: Find the same HTML/JSX element tree repeated across files (e.g., card patterns, empty states, modal layouts)
- **Identical state + effect patterns**: Find the same `useState` + `useEffect` combination doing the same thing in multiple components (e.g., fetching data, handling toggle state)
- **Identical API fetch patterns**: Find the same `fetch('/api/...')` call with the same response handling in multiple components

### 2. Compare each pair

For each pair of suspected duplicates:
- Read both files fully
- Identify the duplicated section (line ranges)
- Note any differences between the two copies (props, routes, minor text changes)
- Classify the difference: is it a parameterizable difference (can be a prop) or a structural difference?

### 3. Classify severity

- **CRITICAL**: Identical logic + markup with no differences — direct copy-paste. Should always be a shared component.
- **HIGH**: Near-identical with 1-2 parameterizable differences (e.g., different href, different label). Should be a shared component with props.
- **MEDIUM**: Similar structure but with meaningful behavioral differences. Consider extracting the shared parts.
- **LOW**: Loosely similar patterns that follow a convention but aren't true duplicates.

### 4. Output the report

```
## Duplicate Components Audit — <date>

### Findings
| Component Pattern | Files | Severity | Differences | Recommendation |
|------------------|-------|----------|-------------|----------------|
| Example pattern | file-a.tsx, file-b.tsx | HIGH | href prop | Extract shared component with prop |
| ... | ... | ... | ... | ... |

### Duplicates Found
1. **[HIGH]** Example Pattern
   - `src/components/example/file-a.tsx` lines XX-YY
   - `src/components/example/file-b.tsx` lines XX-YY
   - Differences: `href` value
   - Fix: Extract to shared component with configurable prop

### Summary
- Component groups scanned: X
- Duplicates found: X (CRITICAL: X, HIGH: X, MEDIUM: X, LOW: X)
- Estimated shared components to extract: X
```

### 5. Suggested fix for each duplicate

For each CRITICAL or HIGH duplicate, specify:
- The shared component file to create (with path)
- The props interface needed
- Which files to update and what to replace
- Any imports to clean up after extraction

## Rules
- Read every file fully — do not guess from file names alone
- Focus on `src/components/` and layout-related files first, then `src/app/` pages
- Ignore test files and type definition files
- A component used once is never a duplicate — there must be 2+ near-identical copies
- Small utility elements (buttons, badges) with identical Tailwind classes are LOW unless they also share state/logic
- Sidebar, header, footer, and navigation components are the highest-priority targets
- If `$ARGUMENTS` contains "verbose", include the full duplicated source for each finding
- If `$ARGUMENTS` contains a directory path, only audit components in that directory
