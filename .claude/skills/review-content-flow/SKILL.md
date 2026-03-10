---
name: review-content-flow
description: Review the content flow, messaging hierarchy, and UX structure of a page. Use for page content reviews.
argument-hint: "[file-path | route]"
---

Review the content flow, messaging hierarchy, and UX structure of a page and provide actionable feedback.

Arguments: $ARGUMENTS
(Optional — a file path like `src/app/page.tsx` or a route like `/pricing`. Defaults to `src/app/page.tsx` if not provided.)

## Your Task

Read the target page file, map out every content section top-to-bottom, and produce a structured review covering narrative arc, headline hierarchy, CTA effectiveness, redundancy, audience alignment, and section ordering.

## Steps

### 1. Resolve the target file

If `$ARGUMENTS` is a file path (contains `.tsx` or `/src/`), read that file directly.

If `$ARGUMENTS` is a route (e.g., `/pricing`), resolve it to a file:
- Try `src/app/<route>/page.tsx`
- If it re-exports from another file, follow the import and read the source

If `$ARGUMENTS` is empty, default to `src/app/page.tsx`.

### 2. Also read supporting layout and navigation files

- Read `src/components/layout/navbar.tsx` — `'use client'` component, shows `AccountDropdown` (name + tier badge + profile card + links) when logged in, "Log In" button when not
- Read `src/components/layout/nav2.tsx` — horizontal module navigation bar used on all public module pages
- If the page is a module landing page (`/hunting`, `/firearms`, etc.), note that it has BOTH `Navbar` and `Nav2` above the content
- If the page is under a `(module)/` route group, read the `(module)/layout.tsx` for sidebar context
- If the page is an account page (`/account/*`), note it uses `Navbar` only (no sidebar)

### 3. Extract the content flow

Parse the JSX and build a section map. For each section, extract:
- **Section name**: from JSX comments (`{/* Hero */}`) or infer from content
- **Headline(s)**: h1, h2, h3 text content
- **Subtext/body copy**: paragraph content summarized
- **CTAs**: button/link text and their `href` targets
- **Visual elements**: images, cards, grids, icons — note what they communicate
- **Data arrays**: if the section renders from a const array (like `modules`, `phases`, `features`), read those arrays to understand the full content

### 4. Analyze narrative arc

Evaluate whether the page tells a coherent story:
- Does it follow a logical progression? (problem → solution → proof → action)
- Does each section build on the previous, or do sections feel disconnected?
- Is there a clear emotional journey? (intrigue → understanding → trust → conversion)
- Where does the story peak? Is the climax in the right place?

### 5. Analyze headline hierarchy

- Is the H1 clear and compelling? Does it communicate the core value prop?
- Do H2s progress logically and avoid repeating the H1's message?
- Are any headlines too similar to each other?
- Do headlines match the audience (e.g., not too beginner-focused if the platform serves all levels)?

### 6. Analyze CTAs

For every CTA on the page:
- What does it say?
- Where does it link?
- Is it the right CTA for that point in the page?
- Are any CTAs redundant (same text, same link, too close together)?
- Is there a clear primary CTA vs. secondary CTA distinction?
- Rule of thumb: a landing page should have 2-3 CTA placements max (top, middle, bottom), not more

**Module landing pages** should have two CTA types:
- "Get Started" → `/auth/signup` (for new users)
- "Access [Module] Module" → module dashboard (for returning users who are already logged in)
Check that both are present and appropriately styled (primary vs outlined/secondary).

### 7. Check messaging consistency

- Does the copy contradict itself anywhere?
- Is the value proposition stated clearly and reinforced (not diluted by too many messages)?
- Are there sections that say essentially the same thing in different words?
- Does the tone stay consistent throughout?

### 8. Evaluate section weight and ordering

- Are important sections buried too low on the page?
- Are any sections disproportionately long or short?
- Is there content that most visitors won't scroll to?
- Would rearranging sections improve the flow?

### 9. Check audience alignment

- Read `CLAUDE.md` or memory files to understand the target audience
- Does the copy speak to that audience?
- Are there assumptions about the reader's experience level that might exclude people?
- Does the page make newcomers feel welcome AND experienced users feel challenged?

## Output

Print results in this format:

```
## Content Flow Review — <page name>
Reviewed: <file path>
Date: <current date>

### Section Flow Map
| # | Section | Headline | CTAs | Notes |
|---|---------|----------|------|-------|
| 1 | Hero | "Lead the Wild." | Get Started → /auth/login | Strong H1, clear value prop |
| 2 | ... | ... | ... | ... |

### Strengths
1. [What works well — be specific]
2. ...

### Issues
1. **[Category]** — [Specific problem and why it matters]
   - *Suggestion:* [How to fix it]
2. ...

### CTA Audit
| CTA Text | Link | Location | Verdict |
|----------|------|----------|---------|
| "Get Started" | /auth/login | Hero | OK — primary action |
| "Get Started" | /auth/login | Hunt section | Redundant — 3rd instance |
| ... | ... | ... | ... |

### Recommended Changes
1. [Highest priority change]
2. [Second priority]
3. ...

### Recommended Section Order
(Only include if different from current)
1. [Section name]
2. ...

### Overall Assessment
**Rating: Strong / Needs Work / Weak**
[1-2 sentence summary of the page's effectiveness]
```

## Rules
- Read every section thoroughly — do not skim or guess content from section names
- Be direct and honest. Praise what works, but don't soften real issues
- Every issue must include a specific, actionable suggestion
- Consider mobile experience — sections that look fine on desktop may be too long on mobile
- "Redundant" means substantially the same message repeated, not reinforcement of a theme
- Don't suggest adding content that doesn't exist yet (e.g., testimonials, social proof) unless it's a critical gap — focus on improving what's there
- If `$ARGUMENTS` contains "compare", also read the pricing page and check for messaging consistency between the two pages
- If `$ARGUMENTS` contains "modules", review ALL 6 module landing pages for cross-module consistency (same structure, same CTA pattern, tone alignment)
- Keep the report scannable — use the table format, not long paragraphs
- When reviewing module landing pages, check that the "Access [Module] Module" CTA links to the correct module dashboard route (not to another module)
