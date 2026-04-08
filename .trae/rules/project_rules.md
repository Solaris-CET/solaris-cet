## Batch Save Runbook

At the end of every completed task batch, output the terminal commands for:

```bash
cd /root/solaris-cet
git status
git diff --stat
git add -A
git diff --staged --stat
git commit -m "feat: <short summary>"
git push
```

Notes:

- Do not run commit/push automatically unless the user explicitly requests it.
- Always recommend running repo checks before committing:
  - `cd app && npm run verify && PW_WORKERS=1 npm run test:e2e`
  - `cd contracts && npm test && npx tsc --noEmit`

