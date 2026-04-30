#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

fail=0

is_sensitive_name() {
  case "$1" in
    *.env|*.env.*|*.pem|*.key|*.p12|*.pfx|id_rsa|id_dsa|id_ecdsa|id_ed25519|*.sqlite|*.db)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

check_file() {
  local path="$1"
  local mode
  mode="$(stat -c '%a' "$path" 2>/dev/null || true)"
  if [[ -z "$mode" ]]; then
    return 0
  fi

  local m="$mode"
  local other=$((m % 10))
  local group=$(((m / 10) % 10))
  if (( other != 0 )); then
    echo "[FAIL] world permissions on $path (mode=$mode)"
    fail=1
    return 0
  fi
  if (( group > 4 )); then
    echo "[WARN] group write/exec on $path (mode=$mode)"
  fi
}

while IFS= read -r -d '' file; do
  base="$(basename "$file")"
  if is_sensitive_name "$base"; then
    check_file "$file"
  fi
done < <(find "$repo_root" -type f -print0)

if (( fail != 0 )); then
  echo "Sensitive file permission check failed."
  exit 1
fi

echo "Sensitive file permission check passed."

