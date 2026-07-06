# Windows Development — SOLARIS CET

## One command (recommended)

```powershell
cd "C:\Users\CCons\Desktop\SOLARIS CET"
npm run dev:local
```

## npm scripts in `app/`

All hoisted binaries use `node ../scripts/run-bin.mjs <tool>` — **not** `../node_modules/.bin/*`.

| Script | Windows entry |
|---|---|
| `typecheck` | `run-bin.mjs tsc` |
| `lint` | `run-bin.mjs eslint` |
| `test` | `run-bin.mjs vitest` |
| `preview:e2e` | `scripts/preview-e2e.mjs` |
| `test:e2e:stable` | `scripts/run-e2e-stable.mjs` |
| `verify:all` | `scripts/verify-all.mjs` |

## Git on Windows

Scripts use `C:\Program Files\Git\bin\git.exe` via `resolveGit()` — never `shell: true` on paths with spaces.

## E2E

```powershell
cd app
npm run build
npm run test:e2e -- tests/pwa-offline.spec.ts --grep "survey shell"
```

## Improvement registry (10k items)

```powershell
npm run improve:audit
npm run improve:status
npm run improve:next -- P0
```

See `docs/planning/improvements/SUMMARY.md`.