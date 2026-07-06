# Solaris-CET — Architecture State

## Current Goal

Ship a single-container Coolify deployment that serves:

- Static SPA from `app/dist/`
- API routes from `app/api/**` compiled into `app/.api-dist/` and executed by `app/server/index.cjs`

## Phase Status

- Phase 1 (Backend, DB & Security): complete
- Phase 2 (TON integration): complete
- Phase 3 (Frontend deep space): complete
- Phase 4 (CI/CD readiness): complete

## Runtime Topology (Coolify)

- Container entrypoint: `node app/server/index.cjs`
- `app/server/index.cjs` serves:
  - static assets from `app/dist/`
  - `/api/*` handlers via CommonJS `require()` from `app/.api-dist/`

## Database (Postgres + Drizzle)

### Connection

- Env: `DATABASE_URL` (required for DB-backed routes)
- Client: `app/db/client.ts` (`postgres` + `drizzle-orm`)

### Schema

Defined in `app/db/schema.ts`:

- `users`
  - wallet identity + referral code + points
- `transactions`
  - on-chain/app transactions (BUY/SELL/MINE)
- `mining_sessions`
  - per-user mining session state
- `sessions`
  - auth session tracking for JWT issuance / revocation
- `audit_logs`
  - security/audit events

## Auth (JWT)

- Route: `app/api/auth/route.ts` (`runtime: nodejs`)
- Token: HS256 JWT (`JWT_SECRET`) with `exp/iat`
- Session tracking:
  - when `JWT_SECRET` is present, the auth route creates a `sessions` row and includes `sid` in the JWT payload
  - GET `/api/auth` verifies JWT and (if `sid` exists) validates the session row is present and not expired/revoked

## Health & Metrics

- `/api/health`: reports configured/missing for `DATABASE_URL`, AI keys, TON RPC
- `/api/status`: quick readiness status + env presence booleans (no secret values)
- `/api/metrics`: Prometheus format + env presence gauges

## TON (RPC)

- `/api/wallet/balance` calls TONCenter JSON-RPC (env: `TONCENTER_RPC_URL`, optional `TONCENTER_API_KEY`)
- `/api/ton/balance` (nodejs runtime) uses TON SDK (`@ton/ton`) for TON balance + CET jetton balance

## Frontend (Vite/React)

- Font: `Syne` (self-hosted via `@fontsource/syne`) + `JetBrains Mono` (woff2 in `/fonts/`)
- Hero quick stats:
  - `totalSupply` reads from `/api/state.json` with fallback values
