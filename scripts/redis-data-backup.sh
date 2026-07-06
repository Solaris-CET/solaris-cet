#!/usr/bin/env bash

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-solaris-redis}"
BACKUP_KEEP_DAYS="${BACKUP_KEEP_DAYS:-14}"

REDIS_CONTAINER="${REDIS_CONTAINER:-redis}"
REDIS_DATA_PATH="${REDIS_DATA_PATH:-/data}"
REDIS_FORCE_SAVE="${REDIS_FORCE_SAVE:-1}"

TS="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
OUT_BASE="${BACKUP_DIR%/}/${BACKUP_PREFIX}-${TS}.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ "$REDIS_FORCE_SAVE" = "1" ]; then
  docker exec "$REDIS_CONTAINER" redis-cli save >/dev/null
fi

docker exec "$REDIS_CONTAINER" sh -lc "test -d '$REDIS_DATA_PATH'" >/dev/null
docker exec "$REDIS_CONTAINER" sh -lc "tar -C '$REDIS_DATA_PATH' -czf - ." >"$OUT_BASE"

OUT="$OUT_BASE"

if [ -n "${BACKUP_PASSPHRASE:-}" ]; then
  openssl enc -aes-256-gcm -salt -pbkdf2 -iter 250000 -in "$OUT" -out "${OUT}.enc" -pass env:BACKUP_PASSPHRASE
  rm -f "$OUT"
  OUT="${OUT}.enc"
fi

if [ "$BACKUP_KEEP_DAYS" -gt 0 ] 2>/dev/null; then
  find "$BACKUP_DIR" -type f -name "${BACKUP_PREFIX}-*.tar.gz*" -mtime "+$BACKUP_KEEP_DAYS" -delete || true
fi

printf '%s\n' "$OUT"

