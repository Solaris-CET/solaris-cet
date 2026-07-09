---
name: memoria
description: SOLARIS CET durable memory — Stash + agent-memory + episodic consolidation for loops. Load before motion; sync after retro.
whenToUse: Loop 0 Memory; session start; before re-deriving architecture; after task complete.
---

# Memoria — SOLARIS CET

Full: `docs/planning/memoria.md` · Loop: `docs/planning/loop-memory.md`

## Retrieve (P0)

```bash
npm run stash:prime -- "<topic>"
stash search "<topic>" --json
```

Read: `agent-memory.md` · `grok.md` · `HANDOFF.md` · feature `design.md`

## Store (P6)

```bash
npm run stash:sync
```

Update `agent-memory.md` only for **durable anti-patterns** or **architecture decisions**.

## Consolidation rule

Episodic (this session) → checkpoint. Semantic (forever) → agent-memory or Stash page.

Never store: command outputs, temp paths, unverified claims.