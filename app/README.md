# Solaris CET — frontend (`app/`)

Vite + React 19 + TypeScript landing for Solaris CET on TON (RAV CET AI UI, TON Connect, PWA). **Production URL:** [https://solaris-cet.com](https://solaris-cet.com) (VPS + Coolify auto-deploy from `main`). Parent repo docs: [../README.md](../README.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Commands

Run these from the **`app/`** directory (from the repo root: `cd app`). If your shell is already `.../solaris-cet/app`, **do not** run `cd app` again — use `npm run …` directly.

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # same idea as CI (no emit)
npm run lint
npm run test         # Vitest
npm run test:e2e     # Playwright (same as CI; needs `dist/` + preview, or use `webServer` in config)
npm run build        # tsc -b + vite build
npm run verify       # lint + typecheck + test + build (quick gate before push)
npm run verify:full  # verify + Playwright E2E (full local check)
```

E2E (Chromium): from `app/`, `npm run test:e2e` (install browsers once: `npx playwright install --with-deps chromium`). The Playwright config starts a preview server unless one is already running.

## Layout

| Path | Purpose |
|------|---------|
| `src/` | UI, hooks, workers, i18n |
| `api/` | CET AI `chat` (Edge) + `auth` (Node + Postgres) — run beside the static build on Coolify/VPS or any Node host |
| `db/` | Drizzle schema / client (used by `api/auth`) |
| `public/` | Static assets; `public/api/state.json` for client state |
| `tests/` | Playwright specs |

## Env (Coolify / production / local)

- **CET AI:** `GROK_API_KEY` / `GEMINI_API_KEY` (or `*_ENC` + `ENCRYPTION_SECRET`) — see `api/lib/crypto.ts` and `scripts/encrypt-key.mjs` in the repo root.
- **Auth API:** database URL expected by `db/client` (see Drizzle config).

## Deploy notes

- **Coolify (production):** build `app/` (output `dist/`), serve the SPA; wire `/api/*` to the same app’s API routes or a companion Node service. Set the same env vars as below.
- **GitHub Pages:** static `dist/` only; `/api/chat` and `/api/auth` need a separate backend unless you disable those features.
- `vercel.json` exists for teams that still deploy on Vercel; it maps `/api/chat` and `/api/auth` when the project root is **`app`**.
