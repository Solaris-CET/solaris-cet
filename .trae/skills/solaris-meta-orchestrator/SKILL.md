---
name: "solaris-meta-orchestrator"
description: "Runs end-to-end delivery with safety gates (repo search→implement→verify→deploy checks). Invoke for big batches spanning SEO+API+UI+deploy."
---

# Solaris Meta Orchestrator

## Purpose

Single entrypoint for complex batches: decomposes work into phases, enforces deterministic verify gates, and prevents scope drift.

## When to Invoke

- Task list has multiple streams (SEO + API + UI + deploy).
- You need a single “do it all” runbook without missing checks.
- You want strict safety (no secrets, no PII logs, no risky deletes).

## Operating Mode

1) Scope freeze: lock the task list for the batch.
2) Repo scan: locate owners, scripts, and runtime constraints.
3) Implementation: minimal churn, reuse existing utilities.
4) Verification: pass required gates.
5) Deploy readiness: Coolify checks + curl Googlebot checks.

## Gates (Required)

```bash
cd /root/solaris-cet && npm run verify:fast
cd /root/solaris-cet && npm run verify:all
```

SEO/SSG checks:

```bash
curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"
cd /root/solaris-cet && npm run lighthouse:audit
```

Deploy checks:

- No secrets as Build Args
- Correct branch/commit SHA in Coolify
- OOM mitigation in build stage if needed
