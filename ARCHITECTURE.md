# ARCHITECTURE

## Overview

Solaris CET este o aplicație Vite + React care include un server Node pentru serving + rute API.

## Servicii

- **Frontend + Node server**: build în `app/dist`, servit de `app/server/index.cjs` pe `PORT` (default `3000`).
- **API**: rute compilate în `app/.api-dist` și servite de același proces Node.
- **Postgres**: DB principală (Drizzle schema în `app/db/schema.ts`).
- **Redis (opțional)**: rate-limit/cache (în producție poate fi Upstash; local poate fi container).
- **Observabilitate (opțional)**: `/api/metrics` + stack local în `docker/compose.observability.yml`.

## Deploy

- Producție: Coolify (build din `Dockerfile` root).
- Healthcheck: `GET /health.json`.
- Compose import (opțional): `docker/coolify.yml`.

## Date

- Conexiunea Postgres folosește `DATABASE_URL`.
- Migrations: `app/db/migrations` (Drizzle).

## CI / Releases

- Gate: `.github/workflows/ci.yml`.
- Release automation: `release-please` (vezi `docs/RELEASE_AUTOMATION.md`).

