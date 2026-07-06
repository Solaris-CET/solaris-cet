---
name: "solaris-coolify-deploy-doctor"
description: "Fixes failing Coolify deploys (OOM, Dockerfile masking, cache, secrets, workspace build). Invoke when build/deploy fails or logs show redaction/corruption."
---

# Solaris Coolify Deploy Doctor

## Primary Failure Modes

- OOM during build (Node/Next spikes).
- Secrets injected as Build Args causing Dockerfile corruption via masking/redaction.
- Cache staleness (building old commit).
- Wrong workspace build script (`--workspace=app` vs `--workspace=api`).

## Hard Rules

- Secrets must be runtime env/secrets, not Build Args.
- Build must be reproducible without secrets.

## Triage Checklist

1) Verify commit SHA in Coolify equals latest push.
2) Confirm branch deployed is correct.
3) Disable Build Args for secrets (DATABASE_URL, passwords, API keys).
4) If OOM:
   - increase host RAM/swap or container memory
   - cap Node: `NODE_OPTIONS=--max-old-space-size=2048` (or higher if available)
   - reduce build steps (skip lint inside build if covered by verify)

## Post-Deploy Checks

```bash
curl -sSI https://solaris-cet.com/health.json | head
curl -A "Googlebot" https://solaris-cet.com/ | grep -i "fotovoltaic"
```
