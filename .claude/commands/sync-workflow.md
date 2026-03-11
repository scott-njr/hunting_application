Sync the auto-fix GitHub Action workflow to both `dev` and `main` branches.

The workflow file at `.github/workflows/auto-fix.yml` must be identical on both branches (GitHub requires it on the default branch `main` for Claude Code App validation).

Steps:
1. Stage and commit `.github/workflows/auto-fix.yml` on the current branch (`dev`) with a descriptive message
2. Push to `origin dev`
3. Switch to `main`: `git checkout main`
4. Pull latest: `git pull origin main`
5. Copy the file from dev: `git checkout dev -- .github/workflows/auto-fix.yml`
6. Commit with the same message
7. Push to `origin main`
8. Switch back: `git checkout dev`

Important:
- Only commit the workflow file — do not stage other changes
- If there are uncommitted changes on dev, stash them first and restore after
- Always end back on the `dev` branch
