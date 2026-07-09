---
name: superpowers
description: SOLARIS-advanced superpowers — mandatory plan-and-verify-before-code discipline for agents and orchestrators. Supersedes naive "jump to coding". Based on obra/superpowers but hardened for AEP + AUTOPROMPT.
whenToUse: Before ANY code change; user says superpowers, TDD, verify-before-done, or orchestrator starts a task.
---

# Superpowers — SOLARIS CET (Grok 4.5+)

Full: `docs/planning/superpowers.md` · Loop: `docs/planning/superpowers-loops.md`

## Pre-Flight (NON-NEGOTIABLE — before first Read of product code)

1. **SPEC** — one sentence success criterion + exact verify command
2. **N-BEST** — 2–3 approaches, score Verifiability first
3. **BLAST RADIUS** — list files you will touch (from graphify, not memory)
4. **PRE-MORTEM** — one paragraph: "This will fail because…"
5. **GATE PLAN** — gate after every edit, not only at end

Only after Pre-Flight PASS → may call Read/Write on `app/`, `survey-engine/`, etc.

## Superpowers laws

- **No code before plan artifact** (even mental — must be written in checkpoint)
- **TDD when behavior changes** — test first or same pass
- **Subagent = one atomic subtask** with its own verify command
- **Orchestrator never trusts worker DONE** without gate output

## Orchestrator rejection criteria

Reject worker output if missing: `SPEC`, `VERIFIED` with literal command output, `PRE-MORTEM` addressed.