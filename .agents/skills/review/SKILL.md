---
name: review
description: Self code-review of the current diff for SOLARIS CET — correctness, fail-loud, tests, conventions, security. Run before finishing any task that changed product code.
whenToUse: After building, before the final checkpoint; or when the user asks for a review of changes.
---

# Self code-review (SOLARIS CET)

Review `git diff` (or the stated change set) against each lens. Report only real findings with `file:line`.

## Lenses

1. **Correctness** — trace one concrete input through the new code. Edge cases: empty, null, unicode, concurrent, offline (PWA flows must survive offline).
2. **Fail loud** — no swallowed errors, no `catch {}`, no silent fallback. Every failure path surfaces to the user or the logs.
3. **Tests** — does a test fail if this change is reverted? If not, the change is untested.
4. **Conventions** — naming, structure, and comment density match the surrounding file. No drive-by refactors.
5. **Security & cost** — no secrets in code or logs; API routes validate input and auth; no unbounded AI-model calls (cost gates stay in place).
6. **Windows/CI parity** — commands work in Git Bash on Windows AND in CI (Node 22, `npm ci` in `app/`).

## Output

For each finding: `severity (P0–P3) · file:line · what breaks · concrete fix`.
Fix P0/P1 findings immediately, then re-run the `verify` skill.
If nothing found after honestly applying all six lenses, say so explicitly.
