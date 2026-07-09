---
name: observer
description: Grok Observer — continuous micro-audit of agent work every action; catches drift, hallucination, scope creep before they compound.
whenToUse: Every tool call batch; orchestrator between subtasks; before DONE checkpoint.
version: "2.0"
---

# Grok Observer (v2.0 Mature)

Full: `docs/planning/grok-observer.md` · Loop: `docs/planning/grok-loop-observer.md`

## Signals S1–S8 (action)

| # | Signal | Action |
|---:|---|---|
| S1 | Edit ∉ BLAST_RADIUS | **HALT** |
| S2 | Claim without EVIDENCE | **HALT** |
| S3 | 2nd retry same command | **WARN** → HALT @3 |
| S4 | Diff > 15 files | **WARN** |
| S5 | 3 turns no gate | **HALT** |
| S6 | Missing PRE-FLIGHT | **HALT** |
| S7 | tokens remaining < 500 | **WARN** |
| S8 | git status surprise | **WARN** → recovery |

## Frequency per loop

- Loop 0–1: Lite after stash/graphify/Pre-Flight
- Loop 2: **Lite every edit**
- Loop 3, 5, 7: Full before accept DONE
- Recovery: Forensic (git diff + rerun gate)

## Verdict (required in checkpoint)

```
OBSERVER: clear
OBSERVER: warn — <reason>
OBSERVER: halt — <reason>
```

Orchestrator: **halt** = reject DONE. Max 3 halts per task → BLOCKED.