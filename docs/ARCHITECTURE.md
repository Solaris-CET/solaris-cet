# Solaris CET — Arhitectură (high-level)

Acest document descrie arhitectura la nivel înalt a proiectului Solaris CET (frontend + API + deploy) și unde se află componentele principale.

## Componente

### Frontend (SPA)

- Cod: `app/src/`
- Build: `app/dist/` (Vite)
- Pagini: `app/src/pages/*` (routing SPA bazat pe `window.location.pathname`)
- Secțiuni: `app/src/sections/*` (componente compuse pentru landing)
- UI primitives: `app/src/components/ui/*` (Radix/shadcn)

### API (rute `/api/*`)

- Source of truth: `app/api/**`
- Output runtime: `app/.api-dist/**` (TypeScript compilat)
- Runtime server: `app/server/index.cjs` servește atât `app/dist/` cât și `/api/*`

### Database (Postgres + Drizzle)

- Client: `app/db/client.ts`
- Schema: `app/db/schema.ts`
- Migrations: `app/drizzle/` (Drizzle)
- Config: `app/drizzle.config.ts`

### TON integration

- Rute API pentru balanțe / state / sync: `app/api/**`
- Contracte: `contracts/` (Blueprint + Tact)

### CET AI

- Endpoint: `app/api/chat/route.ts`
- Provider fallback + cache/metrics: vezi `docs/SOLARIS_CET_AI_ARCHITECTURE_CURSOR_GUIDE.md`

## Deploy & runtime

### Coolify (producție)

- Container entry: `node app/server/index.cjs`
- Static: `app/dist/`
- API: `app/.api-dist/`
- Health/metrics: `/api/health`, `/api/status`, `/api/metrics`

### GitHub Actions

- Quality gate: `.github/workflows/ci.yml`
- Security: CodeQL + dependency review + audit
- Releases: release-please (`.github/workflows/release-please.yml`)

## Decizii cheie

- Monorepo cu npm workspaces: `app/`, `api/`, `contracts/`, `scripts/`.
- Un singur lockfile la root (`package-lock.json`). Instalează din root cu `npm ci`.
- SPA routing fără react-router; serverul livrează `index.html` pentru rute, iar aplicația decide pagina.

## Unde începi ca contributor

- Setup & convenții: `CONTRIBUTING.md`
- Topologie runtime: `ARCHITECTURE_STATE.md`
- Diagramă data flow: `docs/DATA_FLOW.md`
