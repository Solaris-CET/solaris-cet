#!/usr/bin/env bash

set -euo pipefail

ROLLBACK_TAG_FILE="${ROLLBACK_TAG_FILE:-/var/lib/solaris-cet/last-stable-tag}"

if [ -z "${COOLIFY_TAG:-}" ] && [ -f "$ROLLBACK_TAG_FILE" ]; then
  COOLIFY_TAG="$(cat "$ROLLBACK_TAG_FILE" | tr -d '\n' | tr -d '\r')"
  export COOLIFY_TAG
fi

: "${COOLIFY_TAG:?COOLIFY_TAG missing (or provide ROLLBACK_TAG_FILE)}"

/root/solaris-cet/scripts/coolify-deploy-by-tag.sh

