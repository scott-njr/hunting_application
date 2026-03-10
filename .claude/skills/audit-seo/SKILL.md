---
name: audit-seo
description: Audit SEO and AI search optimization across all pages. Check metadata, headings, structured data, and content quality.
argument-hint: "[file-path | route | fix]"
user-invocable: false
---

Audit SEO and AI search optimization across all pages and apply fixes to maximize search visibility.

Arguments: $ARGUMENTS
(Optional — a file path like `src/app/page.tsx`, a route like `/pricing`, or "fix" to auto-apply recommended changes. Defaults to auditing all pages if not provided.)

## Your Task

Systematically audit every page for SEO fundamentals and AI search optimization (Google SGE, Bing Copilot, Perplexity, ChatGPT Search). Check metadata, headings, images, structured data, content quality, and technical SEO. Output a structured report with actionable fixes, and if "fix" is in `$ARGUMENTS`, apply the changes directly.

## Architecture Context

### Public pages (SEO-relevant — focus here)
- `/` — Landing page
- `/pricing` — Pricing with auth-aware `TierCards` client component
- `/auth/login`, `/auth/signup` — Auth pages
- `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical` — Module landing pages (static marketing pages, each with hero + description + features + CTA)
- `/newsletter`, `/spearfishing`, `/about`, `/blog/*`, `/contact` — Content pages

### Authenticated pages (NOT indexable — skip for SEO)
- All `/{module}/(module)/*` routes (deadlines, applications, gear, etc.)
- `/account/profile`, `/account/subscriptions`
- `/modules` (post-login hub)
- `/onboarding`

### Key SEO considerations
- Module landing pages are the most SEO-important — each targets a different keyword vertical (hunting app, firearms training, fishing guide, etc.)
- `Navbar` is a client component — its content (login button, account dropdown) won't be in initial SSR HTML. This is fine for nav but don't rely on it for SEO content.
- `Nav2` is server-rendered and provides cross-linking between module pages — good for internal linking signals
- `TierCards` on pricing is client-rendered — pricing content should also exist in static HTML for indexing

## Steps

### 1. Resolve scope

If `$ARGUMENTS` contains a file path or route, audit only that page.
If `$ARGUMENTS` is empty or "all", audit every PUBLIC page (skip authenticated pages behind auth).
If `$ARGUMENTS` contains "fix", audit all public pages AND apply recommended changes.

### 2. Read the root layout

Read `src/app/layout.tsx` — extract:
- `<title>` or `metadata.title` (static or template)
- `metadata.description`
- `metadata.openGraph` config
- `metadata.twitter` config
- `metadata.robots` config
- `viewport` settings
- Any `<script>` tags for structured data (JSON-LD)
- Favicon/icon configuration
- `metadata.metadataBase` — is it set? (required for OG images to resolve correctly)

### 3. Audit each page's metadata

For each page, read the file and check:

**Title tag:**
- Does the page export `metadata` or `generateMetadata`?
- Is the title unique, descriptive, and under 60 characters?
- Does it include the brand name ("Praevius" or "Lead the Wild")?
- Does it include relevant keywords for the page content?
- Pattern: `[Page-Specific Keywords] | Lead the Wild by Praevius`

**Meta description:**
- Is there a description? Is it 120-160 characters?
- Does it include a clear value proposition and call to action?
- Does it include target keywords naturally?

**Open Graph:**
- `og:title`, `og:description`, `og:image`, `og:type`, `og:url`
- Is `og:image` set? (Critical for social sharing and AI search cards)
- Is the image at least 1200x630?

**Twitter card:**
- `twitter:card` (should be "summary_large_image")
- `twitter:title`, `twitter:description`, `twitter:image`

### 4. Audit heading structure

For each page, parse the JSX and extract all heading elements:
- Is there exactly ONE `<h1>` per page?
- Do headings follow a logical hierarchy (h1 → h2 → h3, no skipping)?
- Do headings contain target keywords?
- Are headings descriptive (not just "Welcome" or "Features")?
- Are any headings hidden or only decorative?

### 5. Audit images

For each page, find all `<Image>` and `<img>` elements:
- Does every image have a meaningful `alt` attribute? (Not empty, not just filename)
- Are alt texts descriptive and keyword-rich where appropriate?
- Are images using Next.js `<Image>` component (for optimization)?
- Is `priority` set on above-the-fold images?
- Are there `width` and `height` attributes (or `fill` with `sizes`)?

### 6. Audit content for AI search optimization

AI search engines (Google SGE, Perplexity, ChatGPT) favor:
- **Clear, direct answers** — Does each page clearly state what it offers in the first 1-2 paragraphs?
- **Entity clarity** — Is "Praevius" / "Lead the Wild" clearly defined as a brand/platform?
- **Topic authority** — Does the content demonstrate expertise (specific details, not generic fluff)?
- **Structured content** — Lists, tables, FAQs that AI can extract and cite
- **Semantic HTML** — `<article>`, `<section>`, `<nav>`, `<main>`, `<header>`, `<footer>` used correctly

Check for:
- Missing `<main>` wrapper on page content
- Sections without semantic purpose
- Content that's too vague for AI to extract useful answers from
- Missing FAQ schema or Q&A patterns that AI search loves to cite

### 7. Check technical SEO

- **Sitemap**: Does `src/app/sitemap.ts` exist? Does it include all public routes?
- **Robots.txt**: Does `src/app/robots.ts` exist? Is it configured correctly?
- **Canonical URLs**: Are canonical URLs set (via metadata or link tags)?
- **JSON-LD structured data**: Check for Organization, WebSite, Product, FAQ, BreadcrumbList schemas
- **Internal linking**: Do pages link to each other? Are anchor texts descriptive?
- **Loading performance**: Are images optimized? Is there excessive client-side JS on public pages?
- **Mobile**: Are there responsive issues (fixed widths, horizontal scroll)?

### 8. Check for common SEO anti-patterns

- Client-side rendered content that search engines can't index (important content in `'use client'` components without server-side data)
- Missing or duplicate title tags across pages
- Thin content pages (< 300 words of meaningful content)
- Broken internal links (href to routes that don't exist)
- Non-descriptive link text ("click here", "learn more" without context)
- Missing `lang` attribute on `<html>`
- Missing `rel="noopener noreferrer"` on external links

### 9. Generate keyword targets

Based on the page content and the platform's purpose, suggest target keywords for each page:
- Primary keyword (1 per page)
- Secondary keywords (2-3 per page)
- Long-tail keywords the page could rank for
- Consider: hunting app, draw strategy, hunting mentor, western hunting, big game hunting, hunting courses, hunt planning, preference points, firearms training, fishing guide, outdoor fitness, wilderness medical, archery training

### 10. Apply fixes (if "fix" in $ARGUMENTS)

If the user passed "fix", apply these changes directly:
- Add or update `metadata` exports on every page
- Add `metadataBase` to root layout if missing
- Fix image `alt` attributes
- Add `sitemap.ts` if missing
- Add `robots.ts` if missing
- Add JSON-LD structured data to root layout (Organization + WebSite schema)
- Fix heading hierarchy issues
- Add `<main>` wrappers where missing

Do NOT change visible page content (headlines, copy, etc.) — only metadata and technical SEO elements.

## Output

```
## SEO & AI Search Audit — <date>

### Global Config
| Element | Status | Value / Issue |
|---------|--------|---------------|
| metadataBase | MISSING | Add to root layout |
| Default title template | ??? | "..." |
| Sitemap | ??? | src/app/sitemap.ts |
| Robots.txt | ??? | src/app/robots.ts |
| JSON-LD (Organization) | ??? | ... |
| HTML lang attribute | ??? | ... |

### Page Audit
| Page | Title | Description | H1 | OG Image | Issues |
|------|-------|-------------|-----|----------|--------|
| / (Landing) | ??? | ??? | "Lead the Wild." | ??? | [list] |
| /pricing | ??? | ??? | ??? | ??? | [list] |
| ... | ... | ... | ... | ... | ... |

### Image Audit
| Page | Image | Alt Text | Status |
|------|-------|----------|--------|
| / | bear_lake_2.JPG | "Mountain lake..." | OK |
| / | [photo strip images] | ??? | MISSING alt |
| ... | ... | ... | ... |

### Heading Audit
| Page | H1 | H2s | Issues |
|------|-----|-----|--------|
| / | "Lead the Wild." | "We meet you...", "Multiple modules..." | OK |
| ... | ... | ... | ... |

### AI Search Readiness
| Page | Entity Clarity | Answer Quality | Structured Content | Score |
|------|---------------|----------------|-------------------|-------|
| / | Good | Good | Needs lists/FAQ | 7/10 |
| ... | ... | ... | ... | ... |

### Keyword Targets
| Page | Primary | Secondary | Long-tail |
|------|---------|-----------|-----------|
| / | hunting platform | mentor, draw strategy | best hunting app for beginners |
| ... | ... | ... | ... |

### Priority Fixes
1. **[CRITICAL]** [Fix description — what and why]
2. **[HIGH]** [Fix description]
3. **[MEDIUM]** [Fix description]
4. ...

### Files Modified (if "fix" mode)
| File | Changes |
|------|---------|
| src/app/layout.tsx | Added metadataBase, JSON-LD |
| src/app/page.tsx | Added metadata export |
| ... | ... |

### Overall SEO Score: X/10
[1-2 sentence summary]
```

## Rules
- Read every page file — do not guess content from route names
- Every issue must have a specific, actionable fix
- Do not change visible page content (copy, headlines, design) — only metadata and technical SEO
- Title tags should follow the pattern: `[Page Keywords] | Lead the Wild by Praevius`
- Descriptions should be 120-160 characters, compelling, and include target keywords
- Always include brand name in metadata (either "Praevius" or "Lead the Wild")
- JSON-LD must be valid — use schema.org types correctly
- For AI search optimization, prioritize clear entity definitions and structured answers
- If "fix" mode is used, verify the build still passes after changes (`npm run build`)
- Do not add metadata to authenticated-only pages that search engines can't access — focus on public pages
- Public pages to prioritize: `/`, `/pricing`, `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`, `/auth/login`, `/auth/signup`, `/blog/*`, `/about`, `/contact`
- Module landing pages are high-value SEO targets — each should have unique metadata targeting its vertical (hunting, firearms, fishing, fitness, medical)
- **NEVER add auth imports to public module root pages** when applying fixes — these must remain pure static for both SSR and SEO
