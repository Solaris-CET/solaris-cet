---
name: anti-hallucinatii
description: Anti-hallucination protocol — evidence hierarchy, 12 laws, recovery after interrupted sessions. All models and orchestrators.
whenToUse: Every checkpoint; before DONE; after Grok Code session interrupt; critique phase; each loop gate.
version: "2.0"
---

# Anti-Halucinații (v2.0 Mature)

Full: `docs/planning/anti-halucinatii.md` · Loop: `docs/planning/anti-halucinatii-loop.md`

## One law

**No claim without evidence from this session** (command output or code citation).

## Truth hierarchy

1. Command output (exit code, N passed)
2. Read tool (path + line)
3. graphify query/path
4. Stash / HANDOFF (hypothesis)
5. Model inference — **forbidden as verdict**

## Checkpoint extension

```
EVIDENCE: <paths read>
VERIFIED: <command + literal output>
HALLUCINATION_RISK: low|medium|high
```

Reject DONE if VERIFIED lacks exit code. AUTOPROMPT `done:true` stub = **high risk**.

## Recovery (Grok Code)

```bash
git status --short && git diff --stat
npm run stash:prime -- "recovery interrupted session"
```

Re-run task gate before new edits. Do not trust prior chat DONE.