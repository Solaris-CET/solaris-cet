---
name: find-skills
description: Discover and load the correct SOLARIS CET skills and planning docs for any task before touching code. Triggers on new session, new task, "which skill", "prime", or before EXECUTE phase.
whenToUse: Start of every session; orchestrator routing; before any file edit.
version: "2.0"
---

# Find Skills — SOLARIS CET (v2.0 Mature)

Full doc: `docs/planning/find-skills.md` · Loop map: `docs/planning/find-loops-skills.md`

## 30-second protocol

```bash
npm run skills:install    # once per machine / after pull
npm run skills:prime -- "<goal>"
npm run stash:prime -- "<goal>"
npm run graphify:prime -- "<goal>"
```

## Checkpoint (obligatoriu)

```
SKILLS_LOADED: ...
DOCS_READ: find-skills.md, ...
GRAPH_NODES: <5-12 real paths>
```

## Skill map (canonical 12)

| Need | Skill | Doc |
|---|---|---|
| Routing / session | `find-skills` | `find-skills.md` |
| Any nontrivial task | `engineering` | `AGENT-ENGINEERING.md` |
| Loops / epics | `loops` | `find-loops-skills.md` |
| Codebase map | `graphify` | `graphify-out/` |
| Plan before code | `superpowers` | `superpowers.md` |
| Honest claims | `anti-hallucinatii` | `anti-halucinatii.md` |
| Self-check | `verify` + `review` | verify skill |
| Memory | `memoria` | `memoria.md` |
| Continuous audit | `observer` | `grok-observer.md` |
| Cost discipline | `token-clock` | `token-clock.md` |
| UI / product design | `unique-design` | `unique-design.md` |

## Rule

**No skill loaded = no code touched.** Orchestrator rejects EXECUTE without SKILLS_LOADED + Pre-Flight (`superpowers.md`).