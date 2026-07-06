---
name: "solaris-testing-qa"
description: "Adds/updates unit + Playwright E2E tests and prevents regressions. Invoke when changing UI flows, API contracts, or fixing flaky tests."
---

# Solaris Testing + QA

## Use When

- Editing primary flows (Hero CTAs, navigation, wallet connect, AI modal).
- Adding endpoints or changing API response shapes.
- Fixing bugs that could regress; add a test first when practical.

## Repo Commands

App:

```bash
cd /root/solaris-cet/app
npm run verify
PW_WORKERS=1 npm run test:e2e
```

Contracts:

```bash
cd /root/solaris-cet/contracts
npm test
npx tsc --noEmit
```

## Practices

- Prefer deterministic tests: mock network where possible and assert UI states.
- Keep E2E selectors stable: `data-testid` or explicit labels.
- For async UI, assert on visible text + timeouts aligned with lazy-load bands.

