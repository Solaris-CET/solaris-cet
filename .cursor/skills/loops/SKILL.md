---
name: loops
description: SOLARIS Perfect Loops — the strict per-task workflow (memory → research → build → verify → retro) and epic orchestration via tasks.md. Use at the start of any nontrivial task or epic.
whenToUse: Starting a new task, feature, or epic; user says "loops", "ralph", "next task", or asks to continue the roadmap.
version: "2.0"
---

# SOLARIS Perfect Loops (v2.0 Mature)

Master: `docs/planning/SOLARIS-LOOPS-MASTER.md` · Skills per loop: `docs/planning/find-loops-skills.md`  
Memory: `docs/planning/loop-memory.md` · Recovery: `docs/planning/HANDOFF.md`  
Engineering: `engineering` skill (AEP P0–P6)

Philosophy: **Memory before motion · Pre-Flight before Read · Verify in code · Fail loud.**

## Outer loop (Ralph)

```bash
npm run loops:next
npm run skills:prime -- "<task>"
npm run stash:prime -- "<task>"
npm run graphify:prime -- "<task>"
# inner 0-7 ...
npm run verify:fast          # sau gate din task
npm run token-clock:burn -- --task "<id>" --tokens <N>
npm run stash:sync
```

Rules: 1 task per session · max 3 retries · state in files not chat · `[x]` only after verify.

## Inner loop (gates between phases)

| # | Step | Gate before next |
|---|---|---|
| 0 | Memory | `MEMORY_PRIME` written |
| 0b | Graph | `GRAPH_NODES` ≥ 5 |
| 1 | Research + Pre-Flight | `PRE-FLIGHT: PASS` (`superpowers-loops.md`) |
| 2 | Build | gate_mic after each edit |
| 3 | Verify | `VERIFIED` literal + exit 0 |
| 4 | Self-attack | review lenses ≥ 8 |
| 5 | Escalate | AEP P5 tier only if gated |
| 6 | Feedback | `grok.md` facts only |
| 7 | Retro | `stash:sync` + token burn |

## Domain verify map

| Domain | Gate |
|---|---|
| Field `/survey` | `survey.spec.ts` E2E |
| AI vision | `cd survey-engine && python -m pytest` |
| CRM / webhooks | Vitest CRM suites |
| Bridge routes | `surveyRouteRegistry.test.ts` |
| Deploy | `npm run deploy:status` (HANDOFF blockers) |

## Recovery (interrupted session)

```bash
git status --short && git diff --stat
npm run stash:prime -- "recovery interrupted session"
```

Re-run task verify **before** new edits. See `anti-halucinatii-loop.md` § Recovery.

Checkpoint: `DONE / VERIFIED / EVIDENCE / OBSERVER / LEFT / BLOCKED`