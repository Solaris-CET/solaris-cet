---
name: "solaris-monorepo-build-orchestrator"
description: "Standardizes workspace scripts and prevents app/api workspace confusion. Invoke when builds fail, scripts drift, or you touch package.json build pipelines."
---

# Solaris Monorepo Build Orchestrator

## Goals

- Deterministic builds across workspaces.
- Correct workspace targeting (`--workspace=app` vs `--workspace=api`).
- Minimal duplicated build logic.

## Workspace Rules

- `app`: builds UI and the site’s API bundle when applicable.
- `api`: only builds/typechecks the standalone API workspace (if used by tooling/CI).
- Root scripts must be explicit and never “guess” workspaces.

## Recommended Root Checks

```bash
cd /root/solaris-cet && npm -ws run typecheck
cd /root/solaris-cet && npm -ws run build
```

If you need a single safe gate:

```bash
cd /root/solaris-cet && npm run verify:fast
```
