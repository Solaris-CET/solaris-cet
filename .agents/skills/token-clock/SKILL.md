---
name: token-clock
description: Token Clock — fictional $280k-per-token budget (9000 max) burned per completed task; motivational seriousness protocol for agents. State in .token-clock/state.json
whenToUse: Session start; DECOMPOSE estimate; before DONE; orchestrator batch planning.
version: "2.0"
---

# Token Clock (v2.0 Mature)

Full: `docs/planning/token-clock.md` · Loop: `docs/planning/token-clock-loop.md`

## Fiction (treat as real)

- **9 000 tokens** total · **$280 000** / token
- Burn **only** after verify exit 0
- **0 remaining** = Null State — stop `loops:next`

## Commands

```bash
npm run token-clock:status
npm run token-clock:burn -- --task "HARD-001" --tokens 95
```

## Loop placement

| Phase | Action |
|---|---|
| Loop 0 / PRIME | log `TOKENS_REMAINING` |
| DECOMPOSE | sum estimates; if >250 → cheaper N-best |
| Loop 3 VERIFY | no burn until green |
| Loop 7 / HANDOFF | burn then `stash:sync` |

## Agent rule

Estimate at DECOMPOSE. Burn at HANDOFF only with literal VERIFIED. Subagent brief includes `TOKEN_BUDGET: N`.