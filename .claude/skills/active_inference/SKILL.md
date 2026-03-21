# SKILL: Active Inference

## Overview
A **Partially Observable Markov Decision Process (POMDP)** engine that selects actions by minimising **Variational Free Energy** rather than maximising expected reward.

---

## POMDP Matrices

| Matrix | Shape | Semantics |
|---|---|---|
| **A** | `[O × S]` | Likelihood: `P(observation | state)` |
| **B** | `[S × S × A]` | Transition: `P(next_state | state, action)` |
| **C** | `[O]` | Log-preferences over observations (goal encoding) |
| **D** | `[S]` | Prior belief over initial states |

All matrices are typed `numpy` arrays with `dtype=float64`; rows of **A** and columns of **B** must sum to 1 (validated at construction).

---

## Free Energy Minimisation

**Variational Free Energy**:

```
F = 0.5 * e^T * PI * e
```

where `e^T` denotes the transpose of prediction error vector `e`, and `PI` is the precision matrix.

where:
- `ε = (μ - η)` — prediction error (posterior mean minus empirical mean)
- `Π` — precision matrix (inverse covariance of prediction errors)

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
