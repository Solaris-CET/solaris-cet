# Solaris CET — Incident Response Plan

## Scope

This plan covers incidents affecting:

- `solaris-cet.com` web surface (SPA + static assets)
- `/api/*` endpoints (auth, chat, metrics, GDPR)
- Docker image and deployment configuration

## Severity

- **SEV-0 (Critical):** Active exploitation, RCE, auth bypass, sensitive data exposure, key compromise
- **SEV-1 (High):** Privilege escalation, IDOR with meaningful impact, supply-chain compromise, persistent XSS
- **SEV-2 (Medium):** Limited data exposure, non-persistent XSS, security misconfig with measurable risk
- **SEV-3 (Low):** Hardening issues, best-practice gaps, informational findings

## First 60 Minutes

- Declare incident: assign an incident commander and a scribe.
- Preserve evidence: keep logs, timestamps, request IDs, and affected environment details.
- Containment:
  - Disable or rate-limit affected endpoints.
  - Rotate exposed secrets immediately (API keys, tokens).
  - If needed, temporarily block offending IP ranges at the edge.
- Communication:
  - Security contact channels: `security@solaris-cet.com`, `t.me/SolarisCET`.
  - Keep details minimal until scope is confirmed.

## Investigation Checklist

- Identify entry point: route, user flow, dependency, infra.
- Determine impacted assets: users, sessions, database rows, secrets.
- Determine impact window: first seen timestamp → containment timestamp.
- Validate whether data exfiltration occurred.

## Remediation

- Patch the vulnerability and add regression tests where applicable.
- Deploy a fix with a clear changelog and risk assessment.
- Rotate secrets and invalidate sessions when relevant.
- Re-run security workflows: dependency audit, container scan, DAST (staging).

## Recovery & Post-Incident

- Verify services are stable (health + metrics).
- Document root cause, timeline, and preventive measures.
- Optional: publish a short postmortem with no sensitive details.

