# Root `scripts/`

Small Node utilities used from the **repository root** (not the Vite app in `app/`).

## Contents

| File | Purpose |
|------|---------|
| [check-dist-for-e2e.mjs](./check-dist-for-e2e.mjs) | `pretest:e2e` from `app/` — fails fast if `app/dist/index.html` is missing. Runs before `npm run test:e2e` and `npm run test:e2e:stable` (which calls `test:e2e`). Build first: `npm run app:build` / `npm run app:verify` or use `npm run verify:all` (run from repo root). |
| [encrypt-key.mjs](./encrypt-key.mjs) | Encrypt API keys for production env (`*_ENC` + `ENCRYPTION_SECRET`); see header comment for usage |
| [sync-sovereign-to-public.mjs](./sync-sovereign-to-public.mjs) | Copies `static/sovereign/` → `app/public/sovereign/` (runs `prebuild` / `predev` in `app/` for OMEGA zero-JS surface at `/sovereign/`) |
| [ton-indexer.ts](./ton-indexer.ts) | DeDust / TON indexer (used by `.github/workflows/ton-indexer.yml`) |
| [load-test.yml](./load-test.yml) | Artillery scenario (homepage + sovereign + one API POST) for quick load checks |
| [k6/smoke.js](./k6/smoke.js) | k6 smoke test (homepage + health + optional `/api/chat`) |

## Commands

```bash
cd /root/solaris-cet
npm ci
npm run scripts:typecheck                 # TypeScript, no emit
npm run index --workspace=scripts         # Run indexer (needs env / network as per workflow)
```

**Verificare completă înainte de push:** vezi tabelul „Verificare monorepo” din [../CONTRIBUTING.md](../CONTRIBUTING.md) (`app/` verify + opțional E2E + `contracts/` test).

Encrypt example (from repo root):

```bash
node scripts/encrypt-key.mjs "$ENCRYPTION_SECRET" "your-raw-api-key"
```

Requires **Node.js ≥ 22**.
