#!/usr/bin/env bash

set -euo pipefail

CHECK_PATH="${CHECK_PATH:-/}"
DISK_FREE_PCT_THRESHOLD="${DISK_FREE_PCT_THRESHOLD:-10}"
STATE_FILE="${STATE_FILE:-/tmp/solaris-disk-space-alert.state}"

BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
CHAT_ID="${TELEGRAM_CHAT_ID:-}"
THREAD_ID="${TELEGRAM_THREAD_ID:-}"

if [ -z "${BOT_TOKEN// }" ] || [ -z "${CHAT_ID// }" ]; then
  printf '%s\n' 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID' >&2
  exit 2
fi

USED_PCT_RAW="$(df -P "$CHECK_PATH" | awk 'NR==2 {print $5}')"
USED_PCT="${USED_PCT_RAW%%%}"

if ! [ "$USED_PCT" -ge 0 ] 2>/dev/null; then
  printf '%s\n' "Could not parse df output: $USED_PCT_RAW" >&2
  exit 1
fi

FREE_PCT=$((100 - USED_PCT))

HOST="$(hostname -f 2>/dev/null || hostname)"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

send() {
  local text="$1"
  local url="https://api.telegram.org/bot${BOT_TOKEN}/sendMessage"

  if [ -n "${THREAD_ID// }" ]; then
    curl -fsS -X POST "$url" \
      -H 'content-type: application/json' \
      -d "{\"chat_id\":\"${CHAT_ID}\",\"message_thread_id\":${THREAD_ID},\"text\":\"${text//\"/\\\"}\",\"disable_web_page_preview\":true}" \
      >/dev/null
  else
    curl -fsS -X POST "$url" \
      -H 'content-type: application/json' \
      -d "{\"chat_id\":\"${CHAT_ID}\",\"text\":\"${text//\"/\\\"}\",\"disable_web_page_preview\":true}" \
      >/dev/null
  fi
}

if [ "$FREE_PCT" -lt "$DISK_FREE_PCT_THRESHOLD" ] 2>/dev/null; then
  if [ ! -f "$STATE_FILE" ]; then
    send "[ALERT] ${HOST}: disk free ${FREE_PCT}% (<${DISK_FREE_PCT_THRESHOLD}%) on ${CHECK_PATH} at ${TS}"
    printf '%s\n' "alerted:${TS}:${FREE_PCT}" >"$STATE_FILE"
  fi
else
  if [ -f "$STATE_FILE" ]; then
    rm -f "$STATE_FILE"
    send "[RECOVERED] ${HOST}: disk free ${FREE_PCT}% on ${CHECK_PATH} at ${TS}"
  fi
fi

