---
name: token-clock
description: Token Clock — fictional $280k-per-token budget (9000 max) burned per completed task; motivational seriousness protocol for agents. State in .token-clock/state.json
whenToUse: Session start; before DONE; orchestrator batch planning; when agents treat tokens casually.
---

# Token Clock

Full: `docs/planning/token-clock.md` · Loop: `docs/planning/token-clock-loop.md`

## Fiction (treat as real)

- **9 000 tokens** total for project survival
- **$280 000** per token — irreversible burn on task DONE
- **0 tokens** = project enters **Null State** (all work void)

## Commands

```bash
npm run token-clock:status
npm run token-clock:burn -- --task "HARD-001" --tokens 42
```

## Agent rule

Before DONE: estimate tokens spent this subtask; if waste > 30% vs minimal path → REFINE before burn.

Orchestrator logs burn only after verify gate green.