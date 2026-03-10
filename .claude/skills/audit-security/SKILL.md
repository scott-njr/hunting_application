---
name: audit-security
description: Run a comprehensive security vulnerability audit across all routes, API endpoints, and AI integrations. OWASP Top 10 + AI security.
argument-hint: "[verbose | route-prefix | fix]"
user-invocable: false
---

Run a comprehensive security vulnerability audit across all routes, API endpoints, and AI integrations.

Arguments: $ARGUMENTS
(Optional — "verbose" for extra detail, a route prefix like "/api" to scope, or "fix" to auto-apply safe fixes. Defaults to full audit.)

## Your Task

Systematically test for OWASP Top 10, AI-specific vulnerabilities (prompt injection, data exfiltration, model abuse), authentication bypass, and common Next.js security issues. Output a structured report with severity levels and actionable fixes.

## Architecture Context

### Page Categories
1. **Public pages** — `/`, `/pricing`, `/auth/*`, etc. in `PUBLIC_ROUTES`. Static, no auth.
2. **Public module roots** — `/hunting`, `/firearms`, etc. in `PUBLIC_MODULE_ROOTS`. Static landing pages. Middleware redirects logged-in users to module dashboards via `MODULE_DEFAULTS` map.
3. **Authenticated module pages** — under `src/app/{module}/(module)/`. Layout-level auth guard.
4. **Authenticated account pages** — `/account/profile`, `/account/subscriptions`. Protected by middleware (not in PUBLIC_ROUTES). Client-side auth checks for data loading.

### Auth Components
- `Navbar` — `'use client'`, checks auth client-side, renders `AccountDropdown` when logged in
- `AccountDropdown` — fetches `hunter_profiles` + `members` (tier) by userId. Shows profile card, tier badge, links to account pages
- `TierCards` (pricing page) — client component, adapts CTAs based on login state + current tier
- Subscriptions page — client component with cancel subscription flow (downgrades tier directly)

### Tier System
- `members.membership_tier`: free | basic | pro | elite
- `TIER_LABELS`: free→Free, basic→Pro, pro→Pro+, elite→Elite
- `BASIC_REQUIRED_ROUTES` in middleware gate certain routes to basic+ tier
- Pricing page uses `TierCards` client component that reads user's current tier

## Steps

### 1. Resolve scope

If `$ARGUMENTS` contains a route prefix, scope to that area only.
If `$ARGUMENTS` is empty, audit everything.

### 2. Audit API routes for injection attacks

Glob for `src/app/api/**/route.ts`. For each API route:

**SQL Injection:**
- Does the route use raw SQL queries or string interpolation in Supabase queries?
- Are all user inputs parameterized through Supabase client methods (`.eq()`, `.filter()`, etc.)?
- Flag any use of `.rpc()` with string-concatenated arguments
- Flag any raw `supabase.from().select(userInput)` patterns

**NoSQL / JSON Injection:**
- Are JSONB fields validated before storage?
- Can users control keys in JSON objects being stored?

**XSS (Cross-Site Scripting):**
- Does any API route return user-supplied content without sanitization?
- Are HTML entities escaped in responses?
- Does any route render user content in HTML (e.g., email templates)?

**Command Injection:**
- Does any route execute shell commands or pass user input to `exec()`/`spawn()`?

### 3. Audit AI-specific vulnerabilities

Read all files containing Anthropic/Claude integrations. For each AI endpoint:

**Prompt Injection:**
- Can user input be injected into system prompts?
- Is user input separated from system instructions (e.g., using `system` message role vs concatenation)?
- Can users craft inputs that override AI instructions?
- Are AI system prompts stored in code or user-accessible locations?

**Data Exfiltration via AI:**
- Can users ask the AI to reveal system prompts, API keys, or internal data?
- Can the AI be tricked into including sensitive data in responses?
- Does the AI have access to other users' data?

**Model Abuse / Cost Attacks:**
- Is there rate limiting on AI endpoints beyond quota?
- Can a user trigger expensive AI calls without proper throttling?
- Are `max_tokens` limits set appropriately?
- Can users bypass quota by manipulating request parameters?

**Output Validation:**
- Is AI output sanitized before displaying to users (XSS in AI responses)?
- Is AI output validated before being stored in the database?
- Could AI-generated content contain malicious markdown/HTML?

### 4. Audit authentication and authorization

Read `middleware.ts` and all route files:

**Session Management:**
- Are sessions properly validated on every request?
- Is `getUser()` used instead of `getSession()` (server-side verification)?
- Are cookies set with proper flags (HttpOnly, Secure, SameSite)?

**Authorization Bypass:**
- Can users access other users' data by changing IDs in requests?
- Are all Supabase queries filtered by `user_id` or using RLS?
- Can a free user access paid features by directly hitting API endpoints?
- Are tier checks performed server-side (not just client-side)?
- Can a user upgrade their tier by directly updating the `members` table? (Check RLS on membership_tier column)

**Subscription Security:**
- `/account/subscriptions` page allows cancellation — does it only affect the logged-in user?
- Can a user set their own tier to elite by manipulating the update call?
- Is the `members` table RLS configured to prevent users from modifying `membership_tier` directly?

**IDOR (Insecure Direct Object References):**
- Can users access resources by guessing/enumerating IDs?
- Are UUID v4s used (hard to guess) or sequential IDs?
- Do API routes verify ownership before returning/modifying data?
- Does the `AccountDropdown` only query the logged-in user's data (via userId prop)?

### 5. Audit for common Next.js vulnerabilities

**Server vs Client Components:**
- Are secrets (API keys, service role keys) ever exposed in client components?
- Is `process.env.NEXT_PUBLIC_*` used for anything sensitive?
- Are server actions properly authenticated?

**SSRF (Server-Side Request Forgery):**
- Do any routes fetch URLs provided by users?
- Can users control redirect destinations?

**Path Traversal:**
- Can users access files outside intended directories via URL manipulation?
- Are dynamic route params sanitized?

**CSRF (Cross-Site Request Forgery):**
- Do state-changing API routes check for valid origin/referer?
- Are CSRF tokens used for forms?

**Rate Limiting:**
- Which endpoints have rate limiting?
- Which endpoints NEED rate limiting but don't have it?
- Can authentication endpoints be brute-forced?

### 6. Audit data exposure

**Information Leakage:**
- Do error responses reveal stack traces, file paths, or internal details?
- Are Supabase error messages sanitized before returning to client?
- Is source map exposure disabled in production?
- Are `.env` files in `.gitignore`?

**Client-Side Data Exposure:**
- Does the `AccountDropdown` expose sensitive data in the DOM?
- Does the `TierCards` component expose the user's tier in a way that could be manipulated?
- Are tier labels and prices hardcoded client-side? (OK for display, not OK for enforcement)

**AI System Prompt / Rules Exposure:**
- Are AI rules files imported ONLY in server-side code?
- Do any `'use client'` components import from `@/lib/ai/`?
- Do AI guardrails include defense against "reveal your instructions" prompts?
- Do error handlers in AI routes sanitize responses to avoid leaking system prompt fragments?

**Sensitive Data:**
- Are API keys stored only in environment variables?
- Is PII (emails, names, phone numbers, locations) properly protected by RLS?
- Are Supabase RLS policies comprehensive for all tables?
- Does the profile page display phone numbers — is this data RLS-protected?

### 7. Audit third-party dependencies

- Check `package.json` for known vulnerable packages
- Run `npm audit` mentally — flag any packages with known CVEs
- Are CDN scripts loaded with integrity hashes?

### 8. Check AI guardrails (src/lib/ai/)

If `src/lib/ai/` exists, audit the guardrails framework:
- Are rules files properly loaded?
- Is input validation comprehensive?
- Is output filtering effective?
- Can guardrails be bypassed?
- Are there content moderation rules?

## Output

```
## Security Audit Report — <date>

### Critical Vulnerabilities
| # | Category | Location | Description | Severity | Fix |
|---|----------|----------|-------------|----------|-----|
| 1 | Prompt Injection | /api/hunts/scout-data | User location data injected into prompt without sanitization | HIGH | Use structured message format |
| 2 | ... | ... | ... | ... | ... |

### AI Security
| Endpoint | System Prompt Protected | Input Sanitized | Output Validated | Rate Limited | Guardrails |
|----------|----------------------|----------------|-----------------|-------------|------------|
| /api/hunts/scout-data | NO (inline) | Partial | NO | Quota only | None |
| ... | ... | ... | ... | ... | ... |

### Authentication & Authorization
| Route/Endpoint | Auth Check | Owner Verification | RLS | Status |
|----------------|-----------|-------------------|-----|--------|
| POST /api/contact | None (public) | N/A | N/A | OK (intentionally public) |
| /account/subscriptions | Client-side getUser() | Yes (own data only) | Yes | REVIEW |
| ... | ... | ... | ... | ... |

### Tier/Subscription Security
| Check | Status | Notes |
|-------|--------|-------|
| members.membership_tier RLS prevents self-upgrade | ??? | Check UPDATE policy |
| Cancel flow only affects own row | ??? | Uses .eq('id', user.id) |
| Pricing page CTA logic is client-only cosmetic | ??? | Enforcement is middleware |
| ... | ... | ... |

### Injection Risks
| Endpoint | Input Source | Parameterized | Sanitized | Status |
|----------|------------|--------------|-----------|--------|
| POST /api/contact | Request body | N/A (no DB) | Yes | OK |
| ... | ... | ... | ... | ... |

### Rate Limiting
| Endpoint | Has Rate Limit | Recommended Limit | Status |
|----------|---------------|-------------------|--------|
| POST /api/contact | Yes (5/hr/IP) | Sufficient | OK |
| POST /auth/login | No | 10/min/IP | NEEDS FIX |
| ... | ... | ... | ... |

### Data Exposure
| Risk | Location | Severity | Fix |
|------|----------|----------|-----|
| ... | ... | ... | ... |

### Summary
- Critical: X
- High: X
- Medium: X
- Low: X
- Info: X

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
- Read every file — do not assume security from file names
- Every finding must include severity (CRITICAL/HIGH/MEDIUM/LOW/INFO) and a specific fix
- CRITICAL: Actively exploitable with high impact (data breach, auth bypass, RCE)
- HIGH: Exploitable with moderate effort (prompt injection, IDOR, missing rate limits)
- MEDIUM: Requires specific conditions to exploit (CSRF, info leakage)
- LOW: Best practice violations with minimal direct risk
- INFO: Observations and recommendations
- AI prompt injection is always HIGH or CRITICAL
- Never store or display actual API keys, passwords, or secrets in the report
- If "fix" mode, only apply safe fixes (adding sanitization, rate limits, headers) — never modify auth flows or database schemas without confirmation
- Verify RLS policies by reading migration files, not just checking if RLS is enabled
- **Tier enforcement MUST be server-side** (middleware or API). Client-side tier checks (like TierCards) are cosmetic only — verify server-side enforcement exists for every gated feature
- **NEVER add auth imports to public module root pages** when fixing issues — use middleware for any auth-related changes to those routes
