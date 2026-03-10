---
name: deploy
description: Deploy the application to Vercel after build validation. Use when deploying to production.
argument-hint: "[skip-audits | audits-only]"
disable-model-invocation: true
---

Deploy the application to Vercel after running pre-deploy audits.

Arguments: $ARGUMENTS
(Optional — "skip-audits" to deploy immediately, "audits-only" to run checks without deploying. Defaults to full audit + deploy.)

## Your Task

Run a pre-deploy checklist of audits to catch issues before they hit production, then deploy to Vercel.

## Steps

### 1. Build Check

Run the production build first — nothing else matters if this fails.

```bash
source ~/.zprofile && npm run build
```

If the build fails, **stop immediately** and report the errors. Do not proceed to audits or deploy.

**CRITICAL**: Verify that ALL public module root pages show as `○ (Static)` in the build output:
- `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`
If any of these show as `ƒ (Dynamic)`, **stop** — someone added auth imports to a public page. This is the #1 recurring bug.

### 2. Run Tests

```bash
source ~/.zprofile && npm test
```

Report results. If tests fail, **stop and report**. Do not deploy with failing tests.

### 3. Lint Check

```bash
source ~/.zprofile && npm run lint
```

Report any warnings or errors. Warnings are OK to proceed; errors should be fixed first.

### 4. Auth Audit (abbreviated)

Run a quick auth check — not the full verbose audit, just verify:
- All API routes in `src/app/api/**/route.ts` check `auth.getUser()` and return 401 if missing
- Middleware route arrays (`PUBLIC_ROUTES`, `PUBLIC_MODULE_ROOTS`, `BASIC_REQUIRED_ROUTES`) are consistent with actual routes that exist
- No new routes were added without auth protection
- Public module root pages (`src/app/{module}/page.tsx`) have ZERO auth imports — no `createClient`, no `redirect`, no `getUser()`
- Account pages (`/account/profile`, `/account/subscriptions`) are NOT in `PUBLIC_ROUTES`
- `(module)/layout.tsx` files all have auth guards

Output a quick pass/fail summary, not the full audit table.

### 5. Security Spot Check

Quick scan for common pre-deploy security issues:
- Grep for hardcoded secrets: API keys, tokens, passwords in source files (NOT .env files)
- Grep for `console.log` statements that leak sensitive data (auth tokens, user data)
- Verify `.env.local` is in `.gitignore`
- Check that no `.env*` files are tracked in git
- Verify AI rules files (`src/lib/ai/rules/`) are only imported server-side (not in `'use client'` components)
- Check that `members.membership_tier` updates in client code (like `/account/subscriptions`) are RLS-safe

Output a quick pass/fail summary.

### 6. Dead Route Check

Quick check that no routes link to deleted/nonexistent pages:
- Grep `src/` for internal `href` links — verify each target route has a corresponding `page.tsx`
- Check that `MODULE_DEFAULTS` in middleware point to routes that exist
- Check that `AccountDropdown` links (`/modules`, `/account/profile`, `/account/subscriptions`) all resolve
- Check that `TierCards` links work for both logged-in and logged-out states

Only report issues found, not a full scan.

### 7. Deploy

If all checks pass (or $ARGUMENTS is "skip-audits"):

```bash
source ~/.zprofile && npx vercel --prod
```

If `vercel` CLI is not installed:
```bash
source ~/.zprofile && npm i -g vercel && npx vercel --prod
```

If authentication is needed, inform the user they need to run `vercel login` first.

## Output

```
## Pre-Deploy Report — <date>

### Build          ✅ Pass | ❌ Fail
### Static Pages   ✅ All module roots static | ❌ Dynamic pages found
### Tests          ✅ X passing | ❌ X failing
### Lint           ✅ Clean | ⚠️ X warnings | ❌ X errors
### Auth Audit     ✅ All routes protected | ❌ Issues found
### Security Check ✅ No issues | ❌ Issues found
### Dead Routes    ✅ Clean | ❌ Broken links found

---

### Deploy Status
✅ Deployed to: <production URL>
— or —
❌ Blocked: <reason>
```

## Rules
- NEVER deploy if the build fails
- NEVER deploy if tests fail
- NEVER deploy if auth audit finds unprotected API routes
- NEVER deploy if public module root pages are not static
- Lint warnings are acceptable; lint errors should be fixed first
- If any audit finds a critical issue, stop and report it — do NOT auto-fix and deploy in the same run
- If $ARGUMENTS is "skip-audits", skip steps 4–6 but still run build + tests + lint (steps 1–3)
- If $ARGUMENTS is "audits-only", run all checks but skip the deploy step
- Always report the Vercel deployment URL when deploy succeeds
