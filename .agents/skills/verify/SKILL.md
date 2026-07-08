---
name: verify
description: Run the full SOLARIS CET verification gate (lint + typecheck + tests + build, plus domain smoke) and report a checkpoint. Use before declaring any task done.
whenToUse: After any code change, before saying a task is done, or when the user asks "does it work?" / "verify" / "check".
---

# SOLARIS CET — Verify gate

Run these yourself. Never ask the user to test.

## 1. Core gate (always)

```bash
cd app
npm run verify        # lint + typecheck + Vitest + build
```

If anything fails: fix it and re-run. Do not report done with a red gate.

## 2. Domain gate (pick what matches the change)

| Changed area | Extra command |
|---|---|
| `/survey` field flow | `cd app && npm run test:e2e:stable` (or `survey.spec.ts` only) |
| `survey-engine/` (Python) | `cd survey-engine && python -m pytest` |
| API routes | `npm run dev:local` at root, then curl the affected endpoint |
| Deploy/config | `npm run survey:smoke` and `npm run deploy:status` at root |
| Cross-package | `npm run verify:fast` at root |

## 3. Checkpoint (mandatory output)

```
DONE: <what shipped>
VERIFIED: <exact commands + pass/fail counts>
LEFT: <remaining work>
BLOCKED: <blockers, or "-">
```

Windows note: run via npm scripts (they resolve `vite`/`tsc`); do not call `../node_modules/.bin/*` directly.
