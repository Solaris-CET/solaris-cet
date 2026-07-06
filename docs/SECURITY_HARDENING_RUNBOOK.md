# Solaris CET — Security Hardening Runbook

## HTTPS

- Terminate TLS at the edge (Coolify/Traefik/Cloudflare) and force HTTP→HTTPS redirects.
- Keep HSTS enabled only on HTTPS responses.
- Monitor certificate expiry and enable automatic renewal (Let’s Encrypt).

## Network Controls

- Firewall (UFW): allow only 80, 443, and SSH.
- Restrict SSH:
  - Disable password auth; require keys.
  - Periodically review authorized keys and remove unused access.
- Use a VPN (WireGuard) for administrative services when applicable.

## CI Security Gates

- Container scan (Trivy) must pass on PRs and main.
- DAST scan (OWASP ZAP) runs against staging when `ZAP_TARGET_URL` is configured.

## CSP Rollout

- Start with report-only mode and collect reports on `/csp-violation`.
- Tighten policy iteratively based on reports (remove unnecessary sources).

## Manual Security Review (periodic)

- XSS: verify all user-controlled rendering is sanitized; check `dangerouslySetInnerHTML` usage.
- IDOR: ensure server checks ownership/authorization for all object reads/writes.
- Auth/session: verify token expiry, revocation, and rate limiting.

