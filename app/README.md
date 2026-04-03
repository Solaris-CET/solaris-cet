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
npm run verify       # lint + typecheck + test + build (quick gate before push)
npm run verify:full  # verify + Playwright E2E stabil (test:e2e:stable, ca în CI)
```

E2E (Chromium): from `app/`, **`npm run test:e2e`** (install browsers once: `npx playwright install --with-deps chromium`). **`pretest:e2e`** fails fast if `app/dist/index.html` is missing (with a hint). Calling **`npx playwright test` directly** skips that guard — prefer the npm script. Config starts **`vite preview` only** — `dist/` must already exist (`npm run build` or run after `npm run verify`). CI supplies `dist/` from the build job. On **CI**, Playwright uses **one** worker. **Locally**, default `test:e2e` may use multiple workers; use **`PW_WORKERS=1`** or **`npm run test:e2e:stable`** if the preview on :4173 flakes under load. **`npm run verify:full`** runs E2E via **`test:e2e:stable`** (one worker, aligned with CI).

## Layout

| Path | Purpose |
|------|---------|
| `src/` | UI, hooks, workers, i18n |
| `api/` | CET AI `chat` (Edge) + `auth` (Node + Postgres) — run beside the static build on Coolify/VPS or any Node host |
| `db/` | Drizzle schema / client (used by `api/auth`) |
| `public/` | Static assets; `public/api/state.json` for client state |
| `tests/` | Playwright specs |

**CET AI (`src/lib/`):** `cetAiConstants.ts` (query length caps + near-limit band), `cetAiConversation.ts` (copy-for-AI / multi-turn handoff strings), `cetAiQueryUi.ts` (length indicator tone), plus `cetAiTelemetry.ts` and related mesh/burst helpers — see also `docs/PRODUCTION_LAYOUT.md`.

**Brand raster (`src/lib/`):** `brandAssetFilenames.ts` holds logo + `OG_IMAGE_FILENAME`, `PRODUCTION_SITE_ORIGIN`, and URL helpers (`productionBrandLogoUrl`, `productionOgImageUrl`, `productionSiteUrl`, `productionTonConnectIconUrl` for `tonconnect-manifest.json` `iconUrl`) for Node/`vite.config.ts`; `brandAssets.ts` re-exports those and `solarisCetLogoSrc()` for UI (e.g. `SolarisLogoMark`, social meta).

**API CORS (`api/lib/`):** `cors.ts` (`getAllowedOrigin`) — unit-tested in `src/__tests__/apiCors.test.ts` alongside `PRODUCTION_SITE_ORIGIN`.

## Env (Coolify / production / local)

- **CET AI:** `GROK_API_KEY` / `GEMINI_API_KEY` (or `*_ENC` + `ENCRYPTION_SECRET`) — see `api/lib/crypto.ts` and `scripts/encrypt-key.mjs` in the repo root.
- **Auth API:** database URL expected by `db/client` (see Drizzle config).

## Deploy notes

- **Coolify (production):** build `app/` (output `dist/`), serve the SPA; wire `/api/*` to the same app’s API routes or a companion Node service. Set the same env vars as below.
- **GitHub Pages:** static `dist/` only; `/api/chat` and `/api/auth` need a separate backend unless you disable those features.
- `vercel.json` exists for teams that still deploy on Vercel; it maps `/api/chat` and `/api/auth` when the project root is **`app`**.
