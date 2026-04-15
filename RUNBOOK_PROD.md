# Solaris-CET — Runbook (VPS + Coolify)

This is a copy/paste runbook for repeatable deploys and production checks.

## 0) If you see `(END)` in terminal

You are inside the pager (`less`).

```bash
q
```

## 1) Local verification (before push)

```bash
cd /root/solaris-cet
npm run app:verify
PW_WORKERS=1 npm run app:test:e2e
npm run contracts:test
npm run contracts:typecheck
```

## 2) Git save (commit + push)

```bash
cd /root/solaris-cet
git status -sb
git diff --stat | cat
git add -A
git diff --staged --stat | cat
git commit -m "feat: <short message>"
git push
```

If you get `nothing to commit, working tree clean`, there is no staged change to push.

## 3) Coolify: Production env vars rules

Rule:

- Buildtime: only `VITE_*`
- Runtime: all secrets and backend runtime config

### Runtime ON, Buildtime OFF (always)

- `DATABASE_URL`
- `ENCRYPTION_SECRET`
- `GROK_API_KEY_ENC` or `GROK_API_KEY`
- `GEMINI_API_KEY_ENC` or `GEMINI_API_KEY`
- `CET_AI_ENABLE_WEB` (optional; set `1` to enable web retrieval)
- `CET_AI_WEB_ALLOWLIST` (optional; comma-separated domains)
- `TAVILY_API_KEY_ENC` or `TAVILY_API_KEY` (optional; required only if web retrieval is enabled)
- `JWT_SECRET`
- `TONCENTER_RPC_URL`
- `TONCENTER_API_KEY` (optional)
- `UPSTASH_REDIS_REST_URL` (optional)
- `UPSTASH_REDIS_REST_TOKEN` (optional)

After editing env vars:

- press `Update` for each row
- press `Redeploy` (or `Restart` if image is unchanged)

## 4) Live verification after redeploy

```bash
curl -sS https://solaris-cet.com/api/status
echo
curl -sS https://solaris-cet.com/api/health
echo
curl -sS https://solaris-cet.com/api/metrics | egrep 'solaris_env_|solaris_(ai|db|ton)_configured' | head -n 120
echo
```

## 5) How to read the metrics (fast triage)

### Database

- `solaris_env_database_url_present 0` means `DATABASE_URL` is missing in the running container.
- `solaris_db_configured 0` means DB is not configured for runtime features.

### AI

AI is configured only when:

- Grok key is present (plain or encrypted + `ENCRYPTION_SECRET`) AND
- Gemini key is present (plain or encrypted + `ENCRYPTION_SECRET`)

### TON

- `solaris_env_toncenter_rpc_url_present 0` means `TONCENTER_RPC_URL` is missing.
- `TONCENTER_API_KEY` without RPC URL is not enough.

## 6) TON balance endpoint (requires TONCENTER_RPC_URL)

```bash
curl -sS "https://solaris-cet.com/api/ton/balance?address=<TON_ADDRESS>"
```
