#!/usr/bin/env bash

set -euo pipefail

SEED_FILE="${SEED_FILE:-/root/solaris-cet/ops/db/seed-dev.sql}"

if [ ! -f "$SEED_FILE" ]; then
  printf '%s\n' "Seed file not found: $SEED_FILE" >&2
  exit 2
fi

if command -v psql >/dev/null 2>&1; then
  : "${DATABASE_URL:?DATABASE_URL missing}"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SEED_FILE"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    POSTGRES_USER="${POSTGRES_USER:-solaris}"
    POSTGRES_DB="${POSTGRES_DB:-solaris_cet}"
    docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 <"$SEED_FILE"
    exit 0
  fi
fi

printf '%s\n' 'No psql found and docker compose not available' >&2
exit 2

