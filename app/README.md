# Solaris CET — frontend (`app/`)

Vite + React 19 + TypeScript landing for Solaris CET on TON (RAV CET AI UI, TON Connect, PWA). **Production URL:** [https://solaris-cet.com](https://solaris-cet.com) (VPS + Coolify auto-deploy from `main`). Parent repo docs: [../README.md](../README.md), [../CONTRIBUTING.md](../CONTRIBUTING.md).

## Commands

Recommended: run installs and scripts from the **repo root** (monorepo workspaces; single lockfile at root).

```bash
cd /root/solaris-cet
npm ci
npm run app:dev          # http://localhost:5173
npm run verify:fast      # audit + typecheck + unit + build (monorepo)
npm run verify:all       # verify:fast + Playwright E2E stable
npm run app:test:e2e     # Playwright
```

E2E (Chromium): from `app/`, **`npm run test:e2e`** (install browsers once: `npx playwright install --with-deps chromium`). **`pretest:e2e`** fails fast if `app/dist/index.html` is missing (with a hint). Calling **`npx playwright test` directly** skips that guard — prefer the npm script. Config starts **`npm run preview:e2e`** (Vite preview on **127.0.0.1:4173** with a larger Node heap) — `dist/` must already exist (`npm run build` or run after `npm run verify`). CI supplies `dist/` from the build job.

**Workers:** **`PW_WORKERS`** (integer ≥ 1) overrides Playwright parallelism. **GitHub Actions** runs **`npm run test:e2e`** with **`PW_WORKERS`** from the repository variable **`E2E_WORKERS`** (unset or empty → **1** worker on CI). **`npm run test:e2e:stable`** (in `app/`) forces one worker locally; from repo root use **`npm run verify:all`** for the stable full gate.

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
- **CET AI web retrieval (optional):** `CET_AI_ENABLE_WEB=1`, `CET_AI_WEB_ALLOWLIST=...`, `TAVILY_API_KEY` (or `TAVILY_API_KEY_ENC` + `ENCRYPTION_SECRET`).
- **Auth API:** database URL expected by `db/client` (see Drizzle config).
- **JWT (optional):** `JWT_SECRET` enables `/api/auth` token issuance and protects `/api/gdpr` and audit attribution.
- **Rate limiting / cache (optional):** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` enable `/api/chat` rate limiting and `/api/cache`.
- **TON RPC (optional):** `TONCENTER_RPC_URL`, `TONCENTER_API_KEY` enable `/api/wallet/balance`.

## Deploy notes

- **Coolify (production):** run `npm run start:full` (serves `dist/` + `/api/*` from the same container via `server/index.cjs`). Set the same env vars as below.
- **GitHub Pages:** static `dist/` only; `/api/chat` and `/api/auth` need a separate backend unless you disable those features.
- Deployment is managed via **Coolify + VPS** (production path).
