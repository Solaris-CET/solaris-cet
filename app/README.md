# Solaris CET — frontend (`app/`)

Vite + React 19 + TypeScript landing for Solaris CET on TON (RAV Oracle UI, TON Connect, PWA). Parent repo docs: [../README.md](../README.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Commands

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # same idea as CI (no emit)
npm run lint
npm run test         # Vitest
npm run build        # tsc -b + vite build
```

E2E (Chromium): from `app/`, `npx playwright test` (install browsers once: `npx playwright install --with-deps chromium`).

## Layout

| Path | Purpose |
|------|---------|
| `src/` | UI, hooks, workers, i18n |
| `api/` | Vercel serverless: `chat` (Edge), `auth` (Node + Postgres) |
| `db/` | Drizzle schema / client (used by `api/auth`) |
| `public/` | Static assets; `public/api/state.json` for client state |
| `tests/` | Playwright specs |

## Env (Vercel / local)

- **Oracle:** `GROK_API_KEY` / `GEMINI_API_KEY` (or `*_ENC` + `ENCRYPTION_SECRET`) — see `api/lib/crypto.ts` and `scripts/encrypt-key.mjs` in the repo root.
- **Auth API:** database URL expected by `db/client` (see Drizzle config).

## Deploy notes

- **GitHub Pages:** static export only; serverless routes in `api/` need **Vercel** (or similar) with project root **`app`**.
- `vercel.json` maps `/api/chat` and `/api/auth` to the handlers under `api/`.
