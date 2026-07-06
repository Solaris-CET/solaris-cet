---
name: metacognition
description: >-
  Self-monitoring during agent work: token/time budget awareness, action diversity
  to detect loops, and file blast radius before large edits. Use for long tasks,
  refactors spanning many files, or when the user asks for careful scope control
  and explicit checkpoints.
---

# SKILL: Metacognition

## Overview

Continuous self-monitoring via two subsystems: **Proprioception** (passive telemetry hooks) and **Nociception** (threshold-triggered interventions).

## When to apply

- Sessions that may exhaust **context** or **wall-clock** budget.
- Risk of **repetitive tool use** or the same failure mode repeating.
- **Large diffs** or touching many files in one step without explicit approval.

## Agent workflow

1. **Estimate** expected effort vs user ask; flag if the task is clearly multi-phase.
2. **Track mentally** (or state explicitly): breadth of actions, files touched, and whether progress is real vs circular.
3. If approaching limits in the table below, **stop**, summarise state, and surface blockers or ask for confirmation—do not silently continue.

---

## Proprioception — PostToolUse Hooks

Intercept every tool call and update four orthogonal gauges with zero overhead when within normal bounds:

| Gauge | Metric | Unit |
|-------|--------|------|
| **O2** | Token consumption rate | tokens/min |
| **Chronos** | Elapsed wall-clock time | seconds |
| **Vestibular** | Action-type diversity | entropy (bits) |
| **Spatial** | Cumulative file-impact radius | files modified |

Gauges are stored in a lightweight in-memory ring buffer (last 32 observations) and exposed as a read-only struct to all sibling modules.

---

## Nociception — Critical Thresholds

When any gauge exceeds its threshold, emit a structured `stderr` intervention and pause execution until the anomaly is acknowledged or auto-resolved:

| Condition | Threshold | Intervention |
|-----------|-----------|----------------|
| Token budget exhaustion | O2 > 90 % of context limit | Summarize + reset working memory |
| Time overrun | Chronos > 5 × expected task time | Checkpoint state, surface blockers |
| Action loop | Vestibular entropy < 0.5 bits (last 8 steps) | Trigger DARS resampling |
| Blast-radius spike | Spatial > 15 files in one step | Require explicit confirmation |

---

## Contracts

- All gauge values: `float ∈ [0, 1]` normalised against their respective ceilings.
- Interventions: Pydantic `NociceptionEvent(gauge, value, threshold, action)`.
- Hooks register once at session init; no polling.

## Related modules

- **Tree search** (`tree_search`): low Vestibular entropy triggers **DARS** resampling.
