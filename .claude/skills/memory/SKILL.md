# SKILL: Memory

## Overview
Two complementary memory subsystems: **Synapse** for fast associative retrieval and **MAPLE** for long-horizon learning consolidation.

---

## Synapse — Associative Knowledge Graph

A directed, weighted graph where nodes are semantic concepts and edges represent learned associations.

### Retrieval
Activation spreads from a query node via **propagated activation** (spreading-activation model):

```
a(v, t+1) = (1 - decay) * a(v, t) + sum_{u -> v} w(u,v) * a(u, t)
```

- `decay = 0.15` per step.
- Activation terminates when `max(a) < threshold` or `steps > max_depth`.
- Returns top-k nodes ranked by final activation.

### Storage
- Nodes: `SynapseNode(id, concept, embedding, metadata)`.
- Edges: `SynapseEdge(source, target, weight, last_activated)`.
- Edge weights updated via Hebbian rule: `Δw = η × a(source) × a(target)`.
- Backend: in-process dict for sessions < 10 k nodes; SQLite for persistence.

---

## MAPLE — Meta-learning and Personalisation via Lifelong Experience

Consolidates episodic traces into durable skills and adapts behaviour to session-specific patterns.

### Consolidation Pipeline
1. **Episode buffer**: raw `(state, action, outcome)` triples accumulated during the session.
2. **Clustering**: group semantically similar episodes (cosine similarity > 0.85).
3. **Abstraction**: summarise each cluster into a reusable `Skill(trigger_pattern, action_template, expected_outcome)`.
4. **Integration**: merge new skills into Synapse as high-weight nodes.

### Personalisation
- Tracks per-user preference signals (preferred verbosity, domain vocabulary, error-correction style).
- Modulates **C** (preference matrix in Active Inference) based on accumulated profile.

---

## Contracts

- All graph mutations are transactional (rollback on failure).
- `SynapseNode.embedding`: `numpy` array, `dtype=float32`, L2-normalised.
- `MapleSkill`: Pydantic strict; `trigger_pattern` is a compiled regex.
- Memory capacity: soft limit 50 k nodes; LRU eviction beyond that.
