---
name: "solaris-ops-ci"
description: "Adds deploy/monitoring/CI artifacts (Coolify, k8s, Prometheus, Lighthouse) consistent with this repo. Invoke when touching infra files or workflows."
---

# Solaris Ops + CI

## Use When

- Adding or editing: `docker/**`, `k8s/**`, `.github/workflows/**`, `vercel.json`.
- Setting up health checks, metrics, scaling, and performance budgets.

## Rules (Repo-specific)

- Prefer minimal, composable configs: health, metrics, headers.
- Avoid promising “guaranteed uptime”; expose measurable checks instead.
- Keep secrets out of YAML; use env/secret refs.

## Verification

- App checks:

```bash
cd /root/solaris-cet/app
npm run verify
PW_WORKERS=1 npm run test:e2e
```

- Contracts checks:

```bash
cd /root/solaris-cet/contracts
npm test
```

