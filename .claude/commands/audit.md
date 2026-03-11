Run all audit skills and produce a consolidated report.

Arguments: $ARGUMENTS
(Optional — "auth", "security", "seo", "cell", "editor", "buttons", "memberships", "duplicates", "duplicate-components" to run a single audit. "fix" to auto-apply safe fixes. Defaults to running ALL audits.)

## Your Task

Cycle through every `audit-*.md` skill in `.claude/skills/` and run each one as a subagent. Collect all results into a single consolidated report with a pass/fail summary and prioritized fix list.

## Audit Skills

The following audits exist in `.claude/skills/`:

1. **audit-auth** — Authentication & authorization (route protection, API auth, redirect chains)
2. **audit-security** — OWASP Top 10 + AI security (injection, prompt injection, data exposure, rate limiting)
3. **audit-seo** — SEO & AI search optimization (metadata, headings, structured data, content quality)
4. **audit-cell** — Mobile responsiveness (grids, flex, overflow, touch targets, sidebar)
5. **audit-editor** — Content & UI polish (copy, wording, spacing, color consistency, missing states)
6. **audit-buttons** — Buttons & links (broken hrefs, missing error handling, silent API failures, dead handlers)
7. **audit-memberships** — Membership & subscription (tier gating, module subscriptions, pricing consistency)
8. **audit-duplicates** — Duplicate bronze logging (routes that call `logBronze()` after `aiCall()`, which already logs internally)
9. **audit-duplicate-components** — Duplicate UI components (near-identical markup/logic repeated across multiple files that should be shared)

## Steps

### 1. Resolve scope

If `$ARGUMENTS` names a specific audit (e.g., "auth" or "security"), run only that one.
If `$ARGUMENTS` is empty, run ALL five audits.
If `$ARGUMENTS` includes "fix", pass "fix" through to each audit skill.

### 2. Run each audit

For each audit skill, read the full `.claude/skills/audit-{name}/SKILL.md` file and execute its steps completely. Use subagents to run audits in parallel where possible (auth + security can run together, seo + cell + editor can run together).

Each audit should produce its own report section following the output format defined in its skill file.

### 3. Consolidate results

After all audits complete, merge the results into a single report.

## Output

```
## Full Audit Report — <date>

### Summary Dashboard
| Audit | Status | Critical | High | Medium | Low |
|-------|--------|----------|------|--------|-----|
| Auth | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Security | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| SEO | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Mobile | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Content/UI | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Buttons | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Memberships | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Duplicates | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |
| Dup Components | ✅ Pass / ❌ Fail | 0 | 0 | 0 | 0 |

### Overall: X critical, X high, X medium, X low

---

### Auth Audit
[Full auth audit report from audit-auth.md]

---

### Security Audit
[Full security audit report from audit-security.md]

---

### SEO Audit
[Full SEO audit report from audit-seo.md]

---

### Mobile Audit
[Full mobile audit report from audit-cell.md]

---

### Content/UI Audit
[Full content/UI audit report from audit-editor.md]

---

### Buttons & Links Audit
[Full buttons audit report from audit-buttons.md]

---

### Memberships Audit
[Full memberships audit report from audit-memberships.md]

---

### Duplicates Audit
[Full duplicates audit report from audit-duplicates.md]

---

### Duplicate Components Audit
[Full duplicate components audit report from audit-duplicate-components.md]

---

### Priority Fix List (all audits combined)
1. **[CRITICAL]** [Audit: Auth] — Description and fix
2. **[CRITICAL]** [Audit: Security] — Description and fix
3. **[HIGH]** [Audit: Auth] — Description and fix
4. **[HIGH]** [Audit: SEO] — Description and fix
5. ...
```

## Rules
- Read each audit skill file fully before executing it — follow its steps exactly
- Run audits using subagents where possible to parallelize work
- Do NOT skip any audit unless the user scoped to a specific one via $ARGUMENTS
- Each audit's report should follow the format defined in its own skill file
- The consolidated priority fix list should merge ALL findings, sorted by severity (Critical → High → Medium → Low)
- If any audit finds CRITICAL issues, the overall status is ❌ Fail
- If "fix" is in $ARGUMENTS, pass it through to each audit — but only apply safe fixes (no auth flow changes, no schema changes)
- **NEVER add auth imports to public module root pages** — this applies across ALL audits
- After the report, suggest which fixes to tackle first based on impact and effort
