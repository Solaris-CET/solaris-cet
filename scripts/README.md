# Root `scripts/`

Small Node utilities used from the **repository root** (not the Vite app in `app/`).

## Contents

| File | Purpose |
|------|---------|
| [check-dist-for-e2e.mjs](./check-dist-for-e2e.mjs) | `pretest:e2e` from `app/` — fails fast if `app/dist/index.html` is missing. Runs before `npm run test:e2e` and `npm run test:e2e:stable` (which calls `test:e2e`), so it also guards `npm run verify:full`. Build first: `npm run build` or `npm run verify`. |
| [encrypt-key.mjs](./encrypt-key.mjs) | Encrypt API keys for production env (`*_ENC` + `ENCRYPTION_SECRET`); see header comment for usage |
| [sync-sovereign-to-public.mjs](./sync-sovereign-to-public.mjs) | Copies `static/sovereign/` → `app/public/sovereign/` (runs `prebuild` / `predev` in `app/` for OMEGA zero-JS surface at `/sovereign/`) |
| [ton-indexer.ts](./ton-indexer.ts) | DeDust / TON indexer (used by `.github/workflows/ton-indexer.yml`) |

## Commands

```bash
npm ci
npm run typecheck   # TypeScript, no emit
npm run index       # Run indexer (needs env / network as per workflow)
```

**Verificare completă înainte de push:** vezi tabelul „Verificare monorepo” din [../CONTRIBUTING.md](../CONTRIBUTING.md) (`app/` verify + opțional E2E + `contracts/` test).

Encrypt example (from repo root):

```bash
node scripts/encrypt-key.mjs "$ENCRYPTION_SECRET" "your-raw-api-key"
```

Requires **Node.js ≥ 22**.
