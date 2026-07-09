---
name: find-skills
description: Discover and load the correct SOLARIS CET skills and planning docs for any task before touching code. Triggers on new session, new task, "which skill", "prime", or before EXECUTE phase.
whenToUse: Start of every session; orchestrator routing; before any file edit.
---

# Find Skills — SOLARIS CET

Full doc: `docs/planning/find-skills.md`

## 30-second protocol

```bash
npm run skills:install    # once per machine / after pull
npm run skills:prime -- "<goal>"
npm run stash:prime -- "<goal>"
npm run graphify:prime -- "<goal>"
```

## Skill map (default stack)

| Need | Skill | Doc |
|---|---|---|
| Any nontrivial task | `engineering` | `AGENT-ENGINEERING.md` |
| Loops / epics | `loops` | `SOLARIS-LOOPS-MASTER.md` |
| Codebase map | `graphify` | `GRAPH_REPORT.md` |
| Plan before code | `superpowers` | `superpowers.md` |
| Honest claims | `anti-hallucinatii` | `anti-halucinatii.md` |
| Self-check | `verify` + `review` | verify skill |
| Memory | `memoria` | `memoria.md` |
| Continuous audit | `observer` | `grok-observer.md` |
| Cost discipline | `token-clock` | `token-clock.md` |
| UI / product design | `unique-design` | `unique-design.md` |

## Rule

**No skill loaded = no code touched.** Orchestrator rejects EXECUTE without PRIME checklist.