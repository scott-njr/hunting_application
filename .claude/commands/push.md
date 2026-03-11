Commit all staged/unstaged changes and push to the current branch on GitHub.

Arguments: $ARGUMENTS
(Optional — commit message. If not provided, auto-generate one from the changes.)

## Steps

### 1. Check State

- Run `git status` to see changes
- Run `git branch --show-current` to confirm the branch
- If there are no changes, report "Nothing to commit" and stop

### 2. Stage Changes

- Stage all modified and untracked files: `git add -A`
- Exception: never stage `.env*` files or credentials — warn the user if any are present

### 3. Commit

- If $ARGUMENTS is provided, use it as the commit message
- If not provided, run `git diff --cached --stat` and draft a concise message from the changes
- Always append `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Use HEREDOC format for the commit message

### 4. Push

```bash
git push origin <current-branch>
```

If the push fails due to auth, suggest the user check their Git credentials or SSH keys.

### 5. Confirm

Run `git log --oneline -1` and report the commit hash and message.

## Output

```
## Push Report

Branch: <branch>
Commit: <hash> — <message>
Status: ✅ Pushed | ❌ Failed (<reason>)
```

## Rules
- NEVER force push
- NEVER push to `main` — if on main, warn the user and stop
- NEVER commit `.env*`, credentials, or secret files
- Always end with a confirmation of what was pushed
