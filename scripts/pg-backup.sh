#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-solaris-cet}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT_BASE="${BACKUP_DIR%/}/${BACKUP_PREFIX}-${TS}.dump"

mkdir -p "$BACKUP_DIR"

if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" --format=c --no-owner --no-privileges --file "$OUT_BASE"
else
  : "${PGHOST:?PGHOST missing (or set DATABASE_URL)}"
  : "${PGDATABASE:?PGDATABASE missing (or set DATABASE_URL)}"
  : "${PGUSER:?PGUSER missing (or set DATABASE_URL)}"
  : "${PGPASSWORD:?PGPASSWORD missing (or set DATABASE_URL)}"
  PGPORT="${PGPORT:-5432}"
  pg_dump --format=c --no-owner --no-privileges --file "$OUT_BASE"
fi

OUT="$OUT_BASE"

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  openssl enc -aes-256-gcm -salt -pbkdf2 -iter 250000 -in "$OUT" -out "${OUT}.enc" -pass env:BACKUP_PASSPHRASE
  rm -f "$OUT"
  OUT="${OUT}.enc"
fi

if [ "$BACKUP_KEEP_DAYS" -gt 0 ] 2>/dev/null; then
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}-*.dump*" -mtime "+$BACKUP_KEEP_DAYS" -delete || true
fi

printf '%s\n' "$OUT"
