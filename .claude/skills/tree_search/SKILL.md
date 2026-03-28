---
name: tree-search
description: >-
  Systematic exploration via Language-Agent Tree Search (LATS) and recovery
  via Dynamic Adaptive Resampling (DARS) when confidence is low or action
  diversity collapses. Use when comparing multiple implementation paths,
  debugging ambiguous failures, or escaping local minima in reasoning.
---

# SKILL: Tree Search

## Overview

Two complementary search strategies for navigating large solution spaces: **LATS** for systematic exploration and **DARS** for focused resampling at high-uncertainty decision points.

## When to apply

- Several **credible** approaches exist and one should be chosen with evidence.
- **MCTS-like** expansion: propose, execute/simulate, score, backpropagate.
- **Metacognition** signals low diversity or low confidence at a branch.

## Agent workflow

1. Identify a **root state** (current code / plan) and a **budget** (steps or time).
2. **LATS**: select node (UCB1), expand with a **single** clear candidate, evaluate, backpropagate; prefer deterministic checks when possible.
3. If DARS triggers, **resample** the decision frontier with diverse candidates, score (e.g. with Active Inference EFE), keep top continuations, resume LATS.
4. Return the **best path** with a short rationale, not just the final leaf.

---

## LATS — Language-Agent Tree Search

Monte Carlo Tree Search (MCTS) guided by an LLM value function, operating on a **Tree-of-Code** where each node is a deterministically executable code state.

### Algorithm

```
while budget_remaining:
    node   = tree_policy(root)          # UCB1 selection
    child  = expand(node, llm_propose)  # LLM generates candidate action
    result = simulate(child)            # Deterministic execution
    score  = evaluate(result)           # Distance to objective
    backpropagate(child, score)
return best_path(root)
```

### Key Properties

- **Deterministic execution**: every simulation is reproducible given the same seed.
- **LLM proposals**: the LLM acts as the expansion heuristic, not the policy.
- **UCB1 constant** `c = sqrt(2) ≈ 1.414` (tunable via config).
- Node state: `TreeNode(code_snapshot, action, parent, children, visits, value)`.

---

## DARS — Dynamic Adaptive Resampling Strategy

Activates when Vestibular entropy drops below 0.5 bits (detected by Nociception) or when LATS confidence falls below `p < 0.3` at a decision point.

### Resampling Protocol

1. Identify the **decision frontier** — the last branching node with `visits < min_visits`.
2. Generate `k = 5` diverse candidate continuations using temperature `T = 0.9`.
3. Score each via the Active Inference free-energy estimator.
4. Retain the top-2; discard the rest.
5. Resume LATS from the retained nodes.

---

## Contracts

- `TreeNode` schema: Pydantic strict, all fields typed.
- Simulation results: immutable after creation.
- DARS trigger: emits `DarsEvent(trigger_reason, frontier_node_id, candidates_generated)`.

## Related modules

- **Metacognition** (`metacognition`): supplies Vestibular / loop detection for DARS.
- **Active Inference** (`active_inference`): free-energy scoring for candidate ranking.
