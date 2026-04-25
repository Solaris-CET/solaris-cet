# Deploy Checklist (Coolify)

## Pre-merge

- Ensure PR checks are green.
- Confirm no secrets are introduced in repo changes.

## Merge

- Merge to `main`.
- Confirm Coolify is set to deploy from `main`.

## Coolify post-merge

- Trigger `Redeploy`.
- Confirm runtime env vars exist (never as buildtime):
  - `DATABASE_URL`
  - `ENCRYPTION_SECRET`
  - `GROK_API_KEY(_ENC)`
  - `GEMINI_API_KEY(_ENC)`
  - `TONCENTER_RPC_URL`
  - `JWT_SECRET` or `JWT_SECRETS`
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (optional)
  - `SENTRY_DSN` (optional)
  - `METRICS_TOKEN` (optional; protects `GET /metrics`)

## Live probes

```bash
curl -fsS https://solaris-cet.com/health.json | head -c 200
echo
curl -fsS https://solaris-cet.com/api/health | head -c 400
echo
curl -fsS https://solaris-cet.com/api/metrics | head -c 400
echo
```

If `METRICS_TOKEN` is set:

```bash
curl -fsS -H "Authorization: Bearer $METRICS_TOKEN" https://solaris-cet.com/metrics | head -c 200
echo
```

If `METRICS_TOKEN` is NOT set:

```bash
curl -fsS https://solaris-cet.com/metrics | head -c 200
echo
```

## Rollback

- Coolify → Deployments → redeploy last known-good build.
- Re-run the live probes.

