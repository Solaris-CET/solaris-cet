---
name: "solaris-unlimited-coding"
description: "Runs high-velocity, safe feature/refactor batches with deterministic verify gates. Invoke for multi-file changes, regressions, or when shipping a big task list."
---

# Solaris Unlimited Coding

## Core Objective

Ship large batches fast without breaking deploys: strict validation, minimal churn, no secrets, no TODOs, no dead code.

## Default Operating Rules

- Prefer existing patterns/utilities over new abstractions.
- Never log secrets/PII; never commit env values.
- Keep public pages progressive: HTML-first, JS only for enhancement.
- Avoid adding dependencies unless unavoidable; if added, re-check CWV.

## Execution Playbook

1) **Scope lock**
- Freeze the task list for the batch; don’t context-switch to new requests mid-batch.
- Define “Definition of Done” (DoD): build + verify + deploy constraints.

2) **Search strategy**
- Broad repo understanding: use a search sub-agent.
- Needle lookup: direct grep/glob/read.

3) **Change strategy**
- Small, reversible commits in local working tree (still don’t commit unless user asks).
- Keep changes localized; reuse shared utilities.
- Prefer pure functions + typed contracts at boundaries.

4) **Verification gates (required)**

```bash
cd /root/solaris-cet && npm run verify:fast
cd /root/solaris-cet && npm run verify:all
```

If the task touches Next export/SEO:

```bash
cd /root/solaris-cet && npm run build --workspace=app
```

## Output Requirements

- Always provide file links for key changes.
- Always provide a user-run save runbook (git status/diff/add/commit/push).
