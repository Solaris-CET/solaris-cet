---
name: observer
description: Grok Observer — continuous micro-audit of agent work every action; catches drift, hallucination, scope creep before they compound.
whenToUse: Every tool call batch; orchestrator between subtasks; before DONE checkpoint.
---

# Grok Observer

Full: `docs/planning/grok-observer.md` · Loop: `docs/planning/grok-loop-observer.md`

## Micro-pulse (run mentally or explicitly each turn)

| Signal | Action |
|---|---|
| New file in diff not in plan | STOP — update BLAST RADIUS or revert |
| Claim without citation | STOP — Read or run command |
| 2nd retry same command | CHANGE strategy (DARS) |
| Diff > 15 files | ESCALATE — scope review |
| No verify in last 3 turns | FORCE gate now |

## Observer verdict

Each checkpoint adds: `OBSERVER: clear | warn:<reason> | halt:<reason>`