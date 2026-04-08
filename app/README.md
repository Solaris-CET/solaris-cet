# Solaris CET — frontend (`app/`)

Vite + React 19 + TypeScript landing for Solaris CET on TON (RAV CET AI UI, TON Connect, PWA). **Production URL:** [https://solaris-cet.com](https://solaris-cet.com) (VPS + Coolify auto-deploy from `main`). Parent repo docs: [../README.md](../README.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Commands

Run these from the **`app/`** directory (from the repo root: `cd app`). If your shell is already `.../solaris-cet/app`, **do not** run `cd app` again — use `npm run …` directly.

```bash
npm ci
npm run dev          # http://localhost:5173
npm run typecheck    # `tsconfig.app` + `tsconfig.node` + `tsconfig.e2e` (Playwright specs), same as CI
npm run lint
npm run test         # Vitest
npm run test:e2e     # Playwright — run `npm run build` first (CI downloads `dist/`; local `verify:full` builds then previews)
npm run build        # tsc -b + vite build
npm run api:build    # compile `api/**` routes to `.api-dist/` for the Node server
npm run start:node   # serve `dist/` + proxy `/api/*` to compiled routes (production-like local)
npm run start:full   # build + api:build + start:node (single command for Coolify/VPS)
npm run verify       # lint + typecheck + test + build (quick gate before push)
npm run verify:full  # verify + Playwright E2E cu 1 worker local (test:e2e:stable)
```

E2E (Chromium): from `app/`, **`npm run test:e2e`** (install browsers once: `npx playwright install --with-deps chromium`). **`pretest:e2e`** fails fast if `app/dist/index.html` is missing (with a hint). Calling **`npx playwright test` directly** skips that guard — prefer the npm script. Config starts **`npm run preview:e2e`** (Vite preview on **127.0.0.1:4173** with a larger Node heap) — `dist/` must already exist (`npm run build` or run after `npm run verify`). CI supplies `dist/` from the build job.

**Workers:** **`PW_WORKERS`** (integer ≥ 1) overrides Playwright parallelism. **GitHub Actions** runs **`npm run test:e2e`** with **`PW_WORKERS`** from the repository variable **`E2E_WORKERS`** (unset or empty → **1** worker on CI). **`npm run test:e2e:stable`** forces one worker locally. **`npm run verify:full`** uses **`test:e2e:stable`** for predictable local runs.

## Layout

| Path | Purpose |
|------|---------|
| `src/` | UI, hooks, workers, i18n |
| `api/` | CET AI `chat` (Edge) + `auth` (Node + Postgres) — compiled by `api:build` and served by `server/index.cjs` |
| `db/` | Drizzle schema / client (used by `api/auth`) |
| `public/` | Static assets; `public/api/state.json` for client state |
| `tests/` | Playwright specs |

**CET AI (`src/lib/`):** `cetAiConstants.ts` (query length caps + near-limit band), `cetAiConversation.ts` (copy-for-AI / multi-turn handoff strings), `cetAiQueryUi.ts` (length indicator tone), plus `cetAiTelemetry.ts` and related mesh/burst helpers — see also `docs/PRODUCTION_LAYOUT.md`.

**Brand raster (`src/lib/`):** `brandAssetFilenames.ts` holds logo + `OG_IMAGE_FILENAME`, `PRODUCTION_SITE_ORIGIN`, and URL helpers (`productionBrandLogoUrl`, `productionOgImageUrl`, `productionSiteUrl`, `productionTonConnectIconUrl` for `tonconnect-manifest.json` `iconUrl`) for Node/`vite.config.ts`; `brandAssets.ts` re-exports those and `solarisCetLogoSrc()` for UI (e.g. `SolarisLogoMark`, social meta).

**API CORS (`api/lib/`):** `cors.ts` (`getAllowedOrigin`) — unit-tested in `src/__tests__/apiCors.test.ts` alongside `PRODUCTION_SITE_ORIGIN`.

## Env (Coolify / production / local)

- **CET AI:** `GROK_API_KEY` / `GEMINI_API_KEY` (or `*_ENC` + `ENCRYPTION_SECRET`) — see `api/lib/crypto.ts` and `scripts/encrypt-key.mjs` in the repo root.
- **Auth API:** database URL expected by `db/client` (see Drizzle config).
- **JWT (optional):** `JWT_SECRET` enables `/api/auth` token issuance and protects `/api/gdpr` and audit attribution.
- **Rate limiting / cache (optional):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` enable `/api/chat` rate limiting and `/api/cache`.
- **TON RPC (optional):** `TONCENTER_RPC_URL`, `TONCENTER_API_KEY` enable `/api/wallet/balance`.

## Deploy notes

- **Coolify (production):** run `npm run start:full` (serves `dist/` + `/api/*` from the same container via `server/index.cjs`). Set the same env vars as below.
- **GitHub Pages:** static `dist/` only; `/api/chat` and `/api/auth` need a separate backend unless you disable those features.
- `vercel.json` exists for teams that still deploy on Vercel; it maps `/api/chat` and `/api/auth` when the project root is **`app`**.
