---
name: active-inference
description: >-
  Guides POMDP-style reasoning with variational free energy: beliefs over hidden
  states, likelihood/transition matrices, and action selection balancing
  epistemic vs pragmatic value. Use when reasoning under partial observability,
  explicit belief updates, goal vs exploration trade-offs, or when the user
  mentions free energy, EFE, or Active Inference patterns in code or design.
---

# SKILL: Active Inference

## Overview

A **Partially Observable Markov Decision Process (POMDP)** engine that selects actions by minimising **Variational Free Energy** rather than maximising expected reward.

## When to apply

- Designing or reviewing agents that maintain **beliefs** over hidden state.
- Choosing between **explore** (reduce uncertainty) vs **exploit** (satisfy preferences).
- Implementing or validating **A, B, C, D** matrix contracts and normalisation.

## Agent workflow

1. Represent the problem with explicit **states**, **observations**, and **actions** where possible.
2. After each observation, update beliefs with Bayes-style fusion (log-space softmax pattern below).
3. Score candidate actions with **expected free energy**; prefer lower EFE unless the user specifies otherwise.
4. Keep matrix shapes and row/column normalisation consistent with the contracts section.

---

## POMDP Matrices

| Matrix | Shape | Semantics |
|--------|-------|-----------|
| **A** | `[O × S]` | Likelihood: `P(observation | state)` |
| **B** | `[S × S × A]` | Transition: `P(next_state | state, action)` |
| **C** | `[O]` | Log-preferences over observations (goal encoding) |
| **D** | `[S]` | Prior belief over initial states |

All matrices are typed `numpy` arrays with `dtype=float64`; rows of **A** and columns of **B** must sum to 1 (validated at construction).

---

## Free Energy Minimisation

**Variational Free Energy** (scalar form used in implementation notes):

```
F = 0.5 * e^T * PI * e
```

where:

- `e` — prediction error vector (e.g. `ε = μ − η`: posterior mean minus empirical / predicted mean)
- `Π` (`PI`) — precision matrix (inverse covariance of prediction errors)

Action selection:

```python
def select_action(beliefs, A, B, C):
    G = expected_free_energy(beliefs, A, B, C)   # EFE for each action
    pi = softmax(-G)                              # action distribution
    return argmax(pi)                             # greedy selection
```

**Expected Free Energy** decomposes into:

- **Epistemic value** (information gain / curiosity): reduces uncertainty about hidden states.
- **Pragmatic value** (goal-directed): steers observations towards preferred outcomes encoded in **C**.

---

## Belief Updating

```
posterior ∝ likelihood(o | s) × prior(s)
```

Implemented as a single normalised dot-product: `beliefs = softmax(log(A[o, :]) + log(prior))`.

---

## Contracts

- Matrices validated on construction via Pydantic `@validator`.
- `beliefs`: `numpy` array, sums to 1, `dtype=float64`.
- `FreeEnergyStep(beliefs_before, action, observation, beliefs_after, F_value)` logged per step.

## Related modules

- **Memory** (`memory`): supplies priors and consolidated patterns into preference-like structure.
- **Tree search** (`tree_search`): DARS may use free-energy estimates to rank continuations.
