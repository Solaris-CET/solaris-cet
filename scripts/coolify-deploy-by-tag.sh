#!/usr/bin/env bash

set -euo pipefail

COOLIFY_BASE_URL="${COOLIFY_BASE_URL:-}"
COOLIFY_API_TOKEN="${COOLIFY_API_TOKEN:-}"
COOLIFY_RESOURCE_UUID="${COOLIFY_RESOURCE_UUID:-}"
COOLIFY_TAG="${COOLIFY_TAG:-}"

if [ -z "${COOLIFY_BASE_URL// }" ] || [ -z "${COOLIFY_API_TOKEN// }" ] || [ -z "${COOLIFY_RESOURCE_UUID// }" ] || [ -z "${COOLIFY_TAG// }" ]; then
  printf '%s\n' 'Missing COOLIFY_BASE_URL / COOLIFY_API_TOKEN / COOLIFY_RESOURCE_UUID / COOLIFY_TAG' >&2
  exit 2
fi

BASE="${COOLIFY_BASE_URL%/}"
URL="${BASE}/api/v1/deploy"

curl -fsS -X POST "$URL" \
  -H "Authorization: Bearer ${COOLIFY_API_TOKEN}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d "{\"uuid\":\"${COOLIFY_RESOURCE_UUID}\",\"tag\":\"${COOLIFY_TAG}\"}" \
  >/dev/null

if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  node /root/solaris-cet/scripts/telegram-notify.mjs "Coolify deploy triggered: uuid=${COOLIFY_RESOURCE_UUID} tag=${COOLIFY_TAG}"
fi

printf '%s\n' ok

