---
name: loops
description: SOLARIS Perfect Loops — the strict per-task workflow (memory → research → build → verify → retro) and epic orchestration via tasks.md. Use at the start of any nontrivial task or epic.
whenToUse: Starting a new task, feature, or epic; user says "loops", "ralph", "next task", or asks to continue the roadmap.
---

# SOLARIS Perfect Loops (condensed for Kimi)

Master doc: `docs/planning/SOLARIS-LOOPS-MASTER.md` · Recovery: `docs/planning/HANDOFF.md`
Engineering discipline: **`engineering` skill (AEP)** — `docs/planning/AGENT-ENGINEERING.md`. Load it first; every inner-loop step below runs under its P0–P6 phases.
Philosophy: **Memory before motion · Verify in code · Fresh context per task · Fail loud.**

## Outer loop (epics)

```bash
npm run loops:next          # next unchecked task
npm run loops:status        # epic progress
npm run improve:next -- P0  # next improvement from the 10k registry
# ... run inner loop on that one task ...
npm run stash:sync          # mark done in tasks.md
```

Rules: 1 task per session · max 3 retries then stop and report · state lives in `tasks.md`, never in chat.

## Inner loop (every task, in order)

| # | Step | Action |
|---|---|---|
| 0 | Memory | `npm run stash:prime -- <topic>`; `stash search "<query>" --json` (AEP P0) |
| 0b | Graph map | `npm run graphify:prime -- "<topic>"` or `python -m graphify query "…"` — **before** blind grep (AEP P0) |
| 1 | Research + Plan | Graphify orients; then read target code + callers, `docs/planning/global.md`, feature `design.md`; write success criterion + ≤5-step plan (AEP P1) |
| 2 | Build | Surgical diff; tests in the same pass (AEP P2) |
| 3 | Verify | Invoke the `verify` skill — YOU run it, never the user (AEP P3) |
| 4 | Self-attack | Invoke the `review` skill against your own diff; fix P0/P1 findings, re-verify (AEP P4) |
| 5 | Escalate if gated | Cost ladder in the `engineering` skill — only when a gate fires (AEP P5) |
| 6 | Retro | `npm run stash:sync`; log anti-patterns to `docs/planning/agent-memory.md` (AEP P6) |

## Domain verify map

| Domain | Gate |
|---|---|
| Field `/survey` | `survey.spec.ts` E2E |
| AI vision pipeline | `cd survey-engine && python -m pytest` (62+) |
| CRM / webhooks | Vitest CRM suites |
| Frontend + SEO | `npm run lighthouse:audit` (root) |
| Deploy | `npm run survey:post-deploy` (root) |
| Security + cost | `npm run audit:prod` (root) |

## Recovery protocol (first attempt failed)

1. Re-read `docs/planning/HANDOFF.md`.
2. Diagnose root cause — do not retry the same command verbatim.
3. After 3 failed attempts: STOP, write checkpoint with BLOCKED filled in.

Always end with the checkpoint: `DONE / VERIFIED / LEFT / BLOCKED`.
