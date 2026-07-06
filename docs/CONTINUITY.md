# Solaris CET — Continuity & handover

This document describes how the project can be **rebuilt and redeployed** without relying on a single operator, and where **operational secrets** belong (not in this repository).

## Repository & deploy

- **Source:** clone this repo and follow `README.md` for the Vite app under `app/`.
- **Production build:** Coolify (or equivalent) should run `npm ci` in the repo root, then `npm run build --workspace=app` with the same Node version as CI (see `.github/workflows/ci.yml`).
- **Environment:** API keys, RPC endpoints, and any genesis-related material live **only** in the host environment (e.g. Coolify env vars). Never commit them.

## Static OMEGA surface

- **Canonical source:** `static/sovereign/` (zero-JS, HTML + CSS).
- **Build pipeline:** `predev` / `prebuild` syncs into `app/public/sovereign/` and injects a short **artifact seal** (git hash + date) via `scripts/inject-sovereign-build-seal.mjs`. The copied tree under `app/public/sovereign/` is gitignored; do not hand-edit it in git.

## Blockchain & domain

- **TON:** smart contracts and token logic are on-chain; the web app is a **client**. Changing hosting does not change on-chain deployment addresses unless you deploy new contracts (a separate, explicit process).
- **Domain & DNS:** keep registrar/auth codes and DNS credentials in your organisation’s vault, not in the repo.

## If core maintainers are unreachable

1. Confirm you have **legal/organisational** authority to operate the domain and infrastructure.
2. Restore **secrets** from your vault (not from git history).
3. Redeploy from a **tagged** release on `main` after reviewing the diff.
4. For **security** disclosures, use the process described in `SECURITY.md` (if present) or the contact channel your organisation has published.

## Community & governance

Public community links (e.g. Telegram, GitHub) are listed on the live site. **Do not** treat chat messages as authoritative for key rotation or legal commitments; use signed releases and documented governance where applicable.

## Verifying what is deployed

- **React app:** the bottom-right **build seal** shows the short git hash and build date (from `vite.config.ts` `define`, overridable via `VITE_GIT_COMMIT_HASH` / `VITE_BUILD_TIMESTAMP` in Coolify).
- **OMEGA static page (`/sovereign/`):** after `npm run build`, the synced HTML includes an **artifact line** injected by `scripts/inject-sovereign-build-seal.mjs` (same env vars or local `git rev-parse`).
- **Compare** the short hash to `git rev-parse --short HEAD` on the tagged release you intend to run.

## Rollback

- Revert or checkout the last known-good **git tag** / commit on `main`, then redeploy the same Docker image or rebuild `app/` with `npm ci && npm run build`.
- Keep **previous `dist/` or image digest** on the host until the new deployment is smoke-tested (health route, `/sovereign/`, wallet flows if applicable).

## CI expectations

- `.github/workflows/ci.yml` enforces lint, tests, and a **main bundle size budget (gzip)** (see workflow).
- Lighthouse thresholds for static `dist/` are in `app/lighthouserc.cjs` and mirrored in `.github/workflows/lighthouse-ci.yml` so PRs cannot silently weaken gates by editing only one file.

## TLS / HSTS

- **Nginx** (`docker/nginx.conf`) can send `Strict-Transport-Security` when it terminates HTTPS. If TLS ends at **Coolify** or a reverse proxy, configure the same header there so browsers always use HTTPS.
- After deploy, validate the **HSTS preload** checklist at [hstspreload.org](https://hstspreload.org/?domain=solaris-cet.com) (valid certificate, redirect to HTTPS, header on the response).
