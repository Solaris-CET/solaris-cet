#!/usr/bin/env bash

set -euo pipefail

echo "== Host preflight =="

echo "-- OS"
uname -a || true

echo "-- Node / Corepack / pnpm"
node -v || true
corepack --version || true
pnpm -v || true

echo "-- Docker"
docker -v || true
docker compose version || true

echo "-- nginx"
nginx -v 2>&1 || true
if command -v nginx >/dev/null 2>&1; then
  nginx -t || true
fi

echo "-- Ports"
ss -lntp | awk 'NR==1 || $4 ~ /:(80|443|3000|4173)$/ {print}' || true

echo "OK"
