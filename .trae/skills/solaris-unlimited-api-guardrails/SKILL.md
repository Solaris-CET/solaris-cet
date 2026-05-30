---
name: "solaris-unlimited-api-guardrails"
description: "Hardens /api routes (CORS, rate limits, validation, safe degradation, no PII logs). Invoke when adding/modifying any app/api/** endpoint or API contracts."
---

# Solaris Unlimited API Guardrails

## Mandatory Requirements

- CORS: allow only known origins; set `Vary: Origin`.
- Rate limit: per-IP key; degrade safely if store missing.
- Validation: reject invalid inputs with clear 4xx errors.
- Privacy: never log raw request bodies containing PII.
- Secrets: never echo env vars; never store secrets in repo.

## Implementation Pattern

1) Parse input (formData or JSON) into a typed payload.
2) Normalize (trim, bounds, safe defaults).
3) Validate and fail fast with 400.
4) Apply rate limiting.
5) Perform side effects (email/db) with safe fallbacks.
6) Return JSON for XHR and 303 redirect for HTML forms.

## Verification

```bash
cd /root/solaris-cet && npm --workspace=app run typecheck
cd /root/solaris-cet && npm --workspace=app run build
```
