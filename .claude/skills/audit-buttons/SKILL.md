---
name: audit-buttons
description: Audit all buttons, links, and interactive elements on a page to verify they work correctly. Use when checking for broken links or handlers.
argument-hint: "[file-path | route | all]"
user-invocable: false
---

Audit all buttons, links, and interactive elements on a page to verify they work correctly.

Arguments: $ARGUMENTS
(Optional — a file path like `src/app/account/subscriptions/page.tsx`, a route like `/pricing`, or "all" to audit all pages. Defaults to auditing all pages if not provided.)

## Your Task

Read the target page(s), find every interactive element (buttons, links, form actions, click handlers), and verify each one has a valid target, correct handler, and proper error handling. Produce a structured report of findings.

## Steps

### 1. Resolve the target file(s)

If `$ARGUMENTS` is a file path (contains `.tsx` or `/src/`), audit that file only.

If `$ARGUMENTS` is a route (e.g., `/pricing`), resolve to `src/app/<route>/page.tsx`.

If `$ARGUMENTS` is "all" or empty, audit all page files:
- Find all `page.tsx` files under `src/app/`
- Also check shared components with interactive elements under `src/components/`

### 2. For each file, extract all interactive elements

Scan the JSX for:
- **`<Link href="...">`** — Next.js client-side navigation
- **`<a href="...">`** — Standard links
- **`<button onClick={...}>`** — Click handlers
- **`<form action={...}>`** or `<form onSubmit={...}>` — Form submissions
- **Elements with `onClick`** — Any div/span/etc. with click handlers
- **`router.push()` / `router.replace()`** — Programmatic navigation
- **`window.location.href`** — Direct navigation
- **`fetch()` calls** — API requests triggered by user actions
- **`supabase.from(...).insert/update/delete`** — Direct DB mutations

### 3. Verify each element

For each interactive element, check:

**Links (`<Link>` and `<a>`):**
- Does the `href` target exist as a route in `src/app/`?
- For dynamic routes (`[slug]`, `[id]`), is the parameter being passed correctly?
- For external links, is `target="_blank"` and `rel="noopener noreferrer"` set?
- For anchor links (`#section`), does the target ID exist on the page?

**Buttons with handlers:**
- Does the `onClick` handler exist and is it defined in the component?
- Does the handler have error handling (try/catch or .catch())?
- If the handler calls `fetch()`, does it check `response.ok`?
- If the handler mutates state, does it handle the loading/error states?
- Is the button disabled during async operations to prevent double-clicks?

**Form submissions:**
- Does the form action/handler validate input before submitting?
- Is there error feedback for failed submissions?
- Is the submit button disabled during submission?

**API calls (`fetch`):**
- Does the API route exist at the expected path?
- Is the HTTP method correct (GET/POST/PUT/DELETE)?
- Is the response status checked?
- Are errors surfaced to the user?

**Supabase mutations:**
- Is `.eq()` filtering by the correct column?
- Is the error result checked?
- Is RLS likely to allow this operation for the current user context?

### 4. Cross-reference routes

For all `href` targets found:
- Verify the route exists by checking `src/app/<route>/page.tsx`
- For module routes, check they're under the correct `(module)` group
- Flag any links to routes that don't exist (404 risk)
- Flag any links that point to the wrong module

### 5. Check for missing interactions

Look for elements that SHOULD be interactive but aren't:
- Status badges or labels that could be clickable
- Table rows that could link to detail pages
- Cards without click handlers that look clickable (have hover styles)
- Missing "back" navigation
- Missing loading states on async buttons

## Output

```
## Button & Link Audit — <page/scope>
Audited: <file path(s)>
Date: <current date>

### Summary
- Total interactive elements: X
- Issues found: X (Y critical, Z warnings)

### Critical Issues
Elements that are broken, lead to 404s, or silently fail:

| # | File | Line | Element | Issue | Fix |
|---|------|------|---------|-------|-----|
| 1 | page.tsx:45 | `<Link href="/old-route">` | Route does not exist | Update href to `/correct-route` |
| 2 | tier-cards.tsx:98 | `fetch('/api/...')` | Response not checked | Add `if (!res.ok)` error handling |

### Warnings
Elements that work but have quality issues:

| # | File | Line | Element | Issue | Suggestion |
|---|------|------|---------|-------|------------|
| 1 | page.tsx:30 | `<button onClick={save}>` | No loading state | Add disabled={saving} |

### All Interactive Elements
| # | File | Line | Type | Target/Handler | Status |
|---|------|------|------|----------------|--------|
| 1 | page.tsx:12 | Link | `/hunting` | OK |
| 2 | page.tsx:25 | Button | `handleSave()` | OK |
| 3 | page.tsx:45 | Link | `/old-route` | BROKEN — 404 |
| 4 | page.tsx:60 | fetch | `POST /api/save` | WARNING — no error check |

### Missing Interactions
Elements that should probably be interactive but aren't:

| # | File | Line | Element | Suggestion |
|---|------|------|---------|------------|
| 1 | page.tsx:80 | Status badge | Could link to status detail page |

### Fixes Applied
(If you were asked to fix issues, list what was changed)

| # | File | Change | Before | After |
|---|------|--------|--------|-------|
```

## Rules
- Read every file thoroughly — do not guess what handlers do from their names alone
- Follow handler chains: if a button calls `handleSave()`, read `handleSave()` to see what it does
- For `fetch()` calls, verify the API route exists AND read it to check for issues
- For shared components (imported from `@/components/`), follow the import and audit the component
- Do NOT fix issues unless explicitly asked — this is an audit, not a repair job
- Flag severity honestly: a missing loading state is a warning, a broken link is critical
- Check both the happy path and error path for every handler
- If `$ARGUMENTS` contains "fix", also fix any critical issues found and list them in "Fixes Applied"
- When auditing "all" pages, prioritize pages with the most user interaction (forms, dashboards, settings) over static/informational pages
- Do not audit node_modules, test files, or storybook files
