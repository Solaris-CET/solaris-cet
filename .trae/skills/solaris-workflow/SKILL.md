---
name: "solaris-workflow"
description: "Standardize verify/run/preview/commit flows. Invoke when finishing a task batch, preparing a demo, or before shipping changes."
---

# Solaris Workflow

## Goals

- Keep changes verifiable and reproducible.
- Ensure every batch ends with lint/typecheck/tests and a clear runbook.
- Avoid accidental commits or pushes.

## Default Command Set (App)

```bash
cd /root/solaris-cet/app
npm ci
npm run verify
PW_WORKERS=1 npm run test:e2e
npm run dev
```

Production-like preview:

```bash
cd /root/solaris-cet/app
npm run build
npm run preview
```

## Default Command Set (Contracts)

```bash
cd /root/solaris-cet/contracts
npm ci
npm test
npx tsc --noEmit
```

## Git Save (User-run)

```bash
cd /root/solaris-cet
git status
git diff --stat
git add -A
git diff --staged --stat
git commit -m "feat: <short summary>"
git push
```

Rules:

- Never run `git commit` unless user asked to commit.
- If CI scripts exist, prefer the repository’s verify scripts over ad-hoc checks.

