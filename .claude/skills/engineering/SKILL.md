---
name: engineering
description: Agent Engineering Protocol (AEP) — the explicit discipline that lets API-token agents reach frontier-model quality; plan → read → build → verify → adversarial self-review → cost-gated escalation. Load at the start of every nontrivial task.
whenToUse: Any nontrivial task; user says "engineering", "AEP", "max performance", "like the best engineers"; before choosing which model/tier to use.
---

# Agent Engineering Protocol — condensed

Full doctrine: `docs/planning/AGENT-ENGINEERING.md`. The rule: **intelligence you don't have is replaced by process you follow.**

## The 7 phases (strict order)

| # | Phase | Non-negotiable action |
|---|---|---|
| P0 | Context | Fresh context per task · `stash:prime` + `graphify:prime` + planning docs · query graph before grep · state in files |
| P1 | Plan | Write the success criterion in one sentence · decompose ≤5 verifiable steps · on design choices generate 2–3 candidates, score, pick |
| P2 | Build | Read code + callers before editing · smallest diff · tests same pass · fail loud |
| P3 | Verify | YOU run `npm run verify` + domain gate · trace one concrete input end-to-end · evidence over confidence |
| P4 | Self-attack | Become a hostile reviewer; run the `review` skill's 6 lenses trying to REFUTE your own work; fix P0/P1 findings, re-verify |
| P5 | Escalate | Cost ladder below — climb ONE tier only when a gate fires, sending a one-paragraph brief |
| P6 | Metacognition | Same failure ×2 → change strategy · 3 strategies failed → BLOCKED + `HANDOFF.md` · always end with DONE/VERIFIED/LEFT/BLOCKED |

## Cost ladder (P5)

Kimi k2.7-code (default, all coding) → kimi-k2-thinking/DeepSeek (hard reasoning) →
`claude-haiku-4-5` $1/$5 (cheap judges) → `claude-sonnet-5` $3/$15 (premium routine text, review judge) →
`claude-opus-4-8` $5/$25 (architecture arbitration) → `claude-fable-5` $10/$50 (ONLY top-tier AHJ/enterprise, ≤20%, via L-SUP-GATE).

Escalation gates: 3 failed attempts · irreversible/customer-facing decision · tied architectural choice.
Cost rules: Batch API −50% for non-urgent Claude calls · prompt caching on repeated prefixes · log premium costs.

## Executable form

`npm run kimi:aep -- --task "…"` (or `--next`) runs a task through this protocol automatically:
the orchestrator (`scripts/kimi-aep-run.mjs`) launches a fresh-context agent per attempt, parses the
mandatory CHECKPOINT block, runs the deterministic gate **in code** (default `npm run verify:fast`),
retries max 3× with a recovery brief, and logs to `docs/planning/aep-runs/`. A done-claim that fails
the gate is treated as a failure — the gate, not the model, decides.

## Contract

Say "done" only after P0–P6 ran honestly. If you skip a phase, name it and say why — never skip silently.
