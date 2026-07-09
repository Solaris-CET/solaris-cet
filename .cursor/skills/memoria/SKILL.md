---
name: memoria
description: SOLARIS CET durable memory — Stash + agent-memory + episodic consolidation for loops. Load before motion; sync after retro.
whenToUse: Loop 0 Memory; session start; before re-deriving architecture; after task complete; recovery.
version: "2.0"
---

# Memoria — SOLARIS CET (v2.0 Mature)

Full: `docs/planning/memoria.md` · Loop: `docs/planning/loop-memory.md`

## Loop 0 — Retrieve (P0)

```bash
npm run skills:prime -- "<topic>"
npm run stash:prime -- "<topic>"
npm run graphify:prime -- "<topic>"
stash search "<topic>" --json
```

Read order: `HANDOFF.md` → `agent-memory.md` → `grok.md` → `global.md` → feature `design.md`

**Output required before Loop 1:**
```
MEMORY_PRIME:
  handoff_blockers: [...]
  stash_hits: [...]
  graph_nodes: [5-12 paths]
  open_questions: [max 3]
```

## Loop 7 — Store (P6)

```bash
npm run stash:sync
```

Promote to `agent-memory.md` only: durable anti-patterns, architecture decisions — after verify green.

## Recovery

```bash
git status --short && git diff --stat
npm run stash:prime -- "recovery interrupted session"
```

Never trust prior chat DONE — trust `git diff` + gates run now.

## Consolidation

Episodic → checkpoint. Semantic → agent-memory or Stash. Never store unverified claims.