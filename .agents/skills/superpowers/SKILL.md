---
name: superpowers
description: SOLARIS-advanced superpowers — mandatory plan-and-verify-before-code discipline for agents and orchestrators. Supersedes naive "jump to coding". Based on obra/superpowers but hardened for AEP + AUTOPROMPT.
whenToUse: Before ANY code change; user says superpowers, TDD, verify-before-done, or orchestrator starts a task.
version: "2.0"
---

# Superpowers — SOLARIS CET (v2.0 Mature)

Full: `docs/planning/superpowers.md` · Loop: `docs/planning/superpowers-loops.md`

## Pre-Flight (NON-NEGOTIABLE — Loop 1, before first Read of product code)

1. **SPEC** — one sentence + exact verify command
2. **N-BEST** — 2–3 approaches; Verifiability ×2 weight
3. **BLAST_RADIUS** — from graphify (max 15 paths)
4. **PRE-MORTEM** — "This will fail because…"
5. **GATE_PLAN** — gate after **every** edit

Artifact:
```
PRE-FLIGHT: PASS
SPEC: ...
APPROACH: ...
BLAST_RADIUS: ...
PRE-MORTEM: ...
GATE_PLAN: ...
```

Only after PASS → Read/Write on `app/`, `survey-engine/`.

## Loop integration

- Loop 0: memoria before Pre-Flight
- Loop 2: execute GATE_PLAN live (not only at end)
- Loop 5: subagent gets copy of Pre-Flight packet only
- AUTOPROMPT: EXECUTE blocked without `pre_flight: pass` in state

## Orchestrator rejection

Reject if missing: `PRE-FLIGHT: PASS`, `VERIFIED` with literal output, edits outside BLAST_RADIUS.