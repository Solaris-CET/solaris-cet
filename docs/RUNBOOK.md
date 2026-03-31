# Solaris CET — operations runbook

Operational notes for the static SPA + Docker/nginx deploy (Coolify → VPS). **Secrets** stay in Coolify env — never in this repo.

## Health check

- **URL:** `GET /health.json` (or `HEAD` for probes)
- **Expected:** HTTP `200`, `Content-Type: application/json`, body with `"status": "healthy"`.
- **Bump `version`** in `app/public/health.json` when you ship a meaningful release (keep aligned with `app/package.json` `version` when practical).
- **Hosting note:** Coolify builds often run **`vite preview`** (see `app/nixpacks.toml` / `npm run start`). Plain Vite preview used to mis-serve `/health.json` as the SPA shell; the repo adds a **`preview-health-json`** plugin in `app/vite.config.ts` so JSON is returned. The **Docker** image uses `docker/nginx.conf` and serves the same file with correct MIME type without that middleware.

## Critical scenarios

### 1. React white screen / ErrorBoundary

**Signs:** User sees the error recovery UI (not a blank page — boundary wraps the app in `main.tsx`).

**Actions:**

1. Check Coolify deployment logs and browser console for the thrown error.
2. **Rollback:** Coolify → Deployments → redeploy previous known-good commit.
3. **Always available:** Users can open **`/sovereign/`** — OMEGA static surface (no JS) with CET supply facts; link is also in the error UI.

### 2. `/sovereign/` returns wrong content or 404

**Verify:**

- After build, `app/public/sovereign/` must exist (synced from `static/sovereign/` via `scripts/sync-sovereign-to-public.mjs`).
- In the running container: files under `/usr/share/nginx/html/sovereign/` (Docker `COPY --from=builder /app/dist`).

**Fix:**

1. Run locally: `node scripts/sync-sovereign-to-public.mjs` from repo root, then `npm run build` in `app/`.
2. Redeploy. Ensure **`location ^~ /sovereign/`** in `docker/nginx.conf` is present so the SPA does not swallow `/sovereign/*`.

### 3. Pool / DeDust stats unavailable (LivePoolStats)

**Signs:** Skeleton state persists or “data unavailable” message.

**Behaviour:** UI should degrade gracefully (DeDust link, cached copy if available).

**Actions:** Check DeDust/API reachability; verify CSP `connect-src` in `app/index.html` still allows `https://api.dedust.io` if endpoints change.

### 4. ONNX / CET AI worker fails

**Signs:** Inference errors in console; worker uses **`/vendor/onnxruntime/`** only (self-hosted).

**Actions:** Confirm `scripts/sync-onnxruntime-assets.mjs` ran in Docker build and nginx serves `/vendor/**` as static files.

## Rollback (production)

1. Coolify → Deployments → select previous successful deployment.
2. Confirm `GET /health.json` returns `200`.
3. **Optional:** `curl -I https://solaris-cet.com/sovereign/` — expect `200` and `text/html` for the static document (not SPA shell for that path).

## Tor / OMEGA

- Static sovereign surface: **`/sovereign/`** — test with Tor Browser **Safest** (JS disabled).
- Do not add third-party script/font CDNs to shipped surfaces.

---

*Keep this file aligned with repo reality; avoid marketing claims not backed by code or contracts.*
