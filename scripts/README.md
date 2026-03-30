# Root `scripts/`

Small Node utilities used from the **repository root** (not the Vite app in `app/`).

## Contents

| File | Purpose |
|------|---------|
| [encrypt-key.mjs](./encrypt-key.mjs) | Encrypt API keys for production env (`*_ENC` + `ENCRYPTION_SECRET`); see header comment for usage |
| [ton-indexer.ts](./ton-indexer.ts) | DeDust / TON indexer (used by `.github/workflows/ton-indexer.yml`) |

## Commands

```bash
npm ci
npm run typecheck   # TypeScript, no emit
npm run index       # Run indexer (needs env / network as per workflow)
```

Encrypt example (from repo root):

```bash
node scripts/encrypt-key.mjs "$ENCRYPTION_SECRET" "your-raw-api-key"
```

Requires **Node.js ≥ 22**.
