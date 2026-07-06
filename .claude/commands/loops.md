---
description: Start SOLARIS Perfect Loops v3 — Ralph outer + inner 0-7 + domain loop for current task.
---

# /loops — SOLARIS Perfect Loops v3

Load and follow `.claude/skills/solaris-perfect-loops/SKILL.md` and `docs/planning/SOLARIS-LOOPS-MASTER.md`.

## Session start (mandatory)

1. `npm run stash:prime -- <user topic>`
2. `npm run loops:next` (if multi-task epic)
3. Read `docs/planning/agent-memory.md` — state prior context or "Fresh"

## Per task

Run **0 → 7** in order. Pick **one Domain Loop** (D1–D12) from master doc.

## Per task end

1. Checkpoint: DONE / VERIFIED / LEFT / BLOCKED
2. `npm run stash:sync`
3. Mark `[x]` in `features/*/tasks.md` if applicable

## Model rule

- **Grok** = orchestrator only
- **DeepSeek** = default code + vision
- **Fable 5** = top-tier text only, ≤20% reports
- **Kimi** = 10+ photos

Confirm loaded, then execute user's task under these loops.