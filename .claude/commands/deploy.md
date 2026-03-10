Deploy the application to Vercel after build validation.

Arguments: $ARGUMENTS
(Optional — "skip-tests" to skip tests, "dry-run" to do checks without deploying. Defaults to full check + deploy.)

## Your Task

Run build, tests, and lint to validate the codebase, then deploy to Vercel. For a full audit (auth, security, SEO, mobile, content), run `/audit` separately before deploying.

## Steps

### 1. Build Check

```bash
source ~/.zprofile && npm run build
```

If the build fails, **stop immediately** and report the errors.

**CRITICAL**: Verify that ALL public module root pages show as `○ (Static)` in the build output:
- `/hunting`, `/archery`, `/firearms`, `/fishing`, `/fitness`, `/medical`
If any show as `ƒ (Dynamic)`, **stop** — someone added auth imports to a public page.

### 2. Run Tests

```bash
source ~/.zprofile && npm test
```

If tests fail, **stop and report**. Do not deploy with failing tests.
(Skip this step if $ARGUMENTS is "skip-tests".)

### 3. Lint Check

```bash
source ~/.zprofile && npm run lint
```

Report warnings and errors. Warnings are OK to proceed; errors should be fixed first.

### 4. Deploy

If all checks pass:

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
## Deploy Report — <date>

### Build          ✅ Pass | ❌ Fail
### Static Pages   ✅ All module roots static | ❌ Dynamic pages found
### Tests          ✅ X passing | ❌ X failing
### Lint           ✅ Clean | ⚠️ X warnings | ❌ X errors

---

### Deploy Status
✅ Deployed to: <production URL>
— or —
❌ Blocked: <reason>
```

## Rules
- NEVER deploy if the build fails
- NEVER deploy if tests fail
- NEVER deploy if public module root pages are not static
- Lint warnings are acceptable; lint errors should be fixed first
- If $ARGUMENTS is "dry-run", run all checks but skip the deploy step
- Always report the Vercel deployment URL when deploy succeeds
- For a full pre-deploy audit, tell the user to run `/audit` first
