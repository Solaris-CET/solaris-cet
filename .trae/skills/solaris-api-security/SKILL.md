---
name: "solaris-api-security"
description: "Designs secure Vite-deployed API routes (edge/node), auth, rate limits, and safe degradation. Invoke when adding or modifying any /api endpoint."
---

# Solaris API + Security

## Use When

- Adding/modifying `app/api/**/route.ts` endpoints.
- Introducing auth, JWT, CORS, rate limits, caching, metrics, or audit trails.

## Rules (Repo-specific)

- Edge runtime endpoints must not use Node-only APIs.
- All API responses must include CORS via `getAllowedOrigin`.
- No secrets in logs. Never echo env vars.
- If an integration needs keys (TON RPC, Upstash, AI providers), degrade gracefully when missing.

## Patterns

- **CORS**: derive `allowedOrigin` and set `Vary: Origin`.
- **Rate limit**: optional Upstash REST, but never block if Redis is not configured.
- **Auth**: HS256 JWT with exp + timing-safe verify. Protect destructive routes (GDPR).
- **Audit**: write to DB if configured, else fallback to stdout.
- **Metrics**: `text/plain; version=0.0.4` for Prometheus.

## Verification

```bash
cd /root/solaris-cet/app
npm run verify
PW_WORKERS=1 npm run test:e2e
```

