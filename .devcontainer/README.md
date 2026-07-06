# Dev container

Environment aligned with [`.github/workflows/ci.yml`](../.github/workflows/ci.yml): Node **22**, root `npm ci`, Python **3.12** for `survey-engine/`, Chromium for Playwright.

## What runs on create

1. `npm ci` at monorepo root (all workspaces).
2. `pip install -e ./survey-engine[api,dev]` — survey engine + pytest.
3. `npx playwright install --with-deps chromium` in `app/`.

First build can take several minutes.

## Typical commands (inside the container)

```bash
# Terminal 1 — survey engine
npm run survey:api

# Terminal 2 — React app
npm run app:dev
# → http://localhost:5173/survey

# Quality gates
npm run survey:test
npm run verify:fast
cd app && npm run test
```

## Ports

| Port | Service |
|---|---|
| 5173 | Vite dev |
| 4173 | Vite preview (E2E) |
| 8000 | Survey engine FastAPI |
| 3000 | Node production server |

## Windows tip

If `npm ci` fails locally with `ENOTEMPTY`, use **Dev Container** or:

```bash
npm run ci:install
```