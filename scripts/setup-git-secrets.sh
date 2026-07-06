#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required"
  exit 1
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "not a git repository"
  exit 1
fi

if ! git secrets --version >/dev/null 2>&1; then
  echo "git-secrets is not installed. Install it first:"
  echo "- macOS (brew): brew install git-secrets"
  echo "- Debian/Ubuntu: apt-get install -y git-secrets (if available) or install from source"
  echo "- Source: https://github.com/awslabs/git-secrets"
  exit 1
fi

git config core.hooksPath .githooks

git secrets --register-aws >/dev/null 2>&1 || true
git secrets --add '-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----' >/dev/null 2>&1 || true
git secrets --add 'xox[baprs]-[0-9A-Za-z-]{10,48}' >/dev/null 2>&1 || true
git secrets --add 'AIza[0-9A-Za-z\-_]{35}' >/dev/null 2>&1 || true
git secrets --add 'sk-(?:live|test)_[0-9a-zA-Z]{16,}' >/dev/null 2>&1 || true

echo "git-secrets enabled (core.hooksPath=.githooks)."

