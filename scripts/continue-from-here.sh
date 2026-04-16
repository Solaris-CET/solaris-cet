#!/usr/bin/env bash
# Run from anywhere: bash scripts/continue-from-here.sh
# Or from app/: npm run continue
# Use after a token/time limit — paste this output into a new AI turn to resume context.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if git -C "$SCRIPT_DIR/.." rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git -C "$SCRIPT_DIR/.." rev-parse --show-toplevel)"
else
  ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
fi
cd "$ROOT"

echo "========== SOLARIS CET — continue from here =========="
echo "UTC: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Root: $ROOT"
echo

echo ">>> Git branch & status"
if git rev-parse --git-dir >/dev/null 2>&1; then
  git branch --show-current 2>/dev/null || true
  git status -sb
else
  echo "(not a git repository)"
fi
echo

echo ">>> Last 8 commits"
git log -8 --oneline --decorate 2>/dev/null || echo "(no git log)"
echo

echo ">>> Working tree (stat)"
git diff --stat 2>/dev/null | head -40 || true
if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  echo "(clean or no git)"
fi
echo

echo ">>> Agent / skill / UI touchpoints (verify paths exist)"
KEYS=(
  "app/src/lib/skillGenome.ts"
  "app/src/data/solarisDepartments.ts"
  "app/src/components/RoleSynthesizedSkills.tsx"
  "app/src/components/LiveNeuralFeed.tsx"
  "app/src/sections/AITeamSection.tsx"
  "app/src/sections/AgenticEngineSection.tsx"
  "app/src/App.tsx"
)
for f in "${KEYS[@]}"; do
  if [[ -f "$ROOT/$f" ]]; then
    echo "  ✓ $f"
  else
    echo "  ✗ $f (missing)"
  fi
done
echo

echo ">>> Manual verify (after you resume work)"
echo "  cd /root/solaris-cet && npm run verify:fast"
echo "  cd /root/solaris-cet && npm run verify:all   # includes Playwright E2E stable"
echo

echo ">>> Paste this into the next chat (edit priority line):"
cat <<'PROMPT'
Continuă de unde s-a oprit sesiunea anterioară. Starea repo e în output-ul comenzii continue-from-here.
Prioritate: [scrie aici: ex. skill genome, i18n, teste].
Rulează din repo root: npm run verify:fast (sau verify:all pentru E2E).
PROMPT
echo "========== end checkpoint ================================="
