# Scalability & Performanță (1011–1040)

Documentul acesta completează runbook-urile existente și leagă checklist-ul de implementarea curentă (Vite + React SPA, Node server + `/api/*`).

## CDN (Cloudflare) în fața origin-ului

- Activează Proxy (orange cloud) pe record-ul DNS al domeniului.
- Activează HTTP/2 și HTTP/3 (QUIC) din Cloudflare (Network).
- Activează Brotli (Speed).
- Creează Cache Rules pentru assets statice:
  - Pattern: `*/assets/*` și fișierele fingerprinted (`*.js`, `*.css`, `*.woff2`, `*.png`, `*.svg`) din build
  - TTL: respectă `Cache-Control` (origin trimite `immutable` + `s-maxage`)
- Rule pentru HTML:
  - `*/index.html` / SPA routes: bypass cache (origin trimite `no-store`)

## Lighthouse (baseline + regression gate)

- CI rulează Lighthouse gate pe PR-uri (vezi workflow-ul de Lighthouse).
- Local, rulează auditul și generează `app/public/lighthouse-scores.json` + `app/public/lighthouse-badge.svg`:

```bash
cd /root/solaris-cet
npm run lighthouse:audit
```

## Brotli la origin (nginx)

- Build-ul Vite emite automat fișiere `.br` pentru assets (JS/CSS/HTML etc.).
- Pentru nginx, există două variante:
  - `docker/nginx.conf`: `gzip` + `gzip_static on` (servește `.gz` dacă există)
  - `docker/nginx.brotli.conf`: `gzip` + `brotli` + `brotli_static on` (necesită modul Brotli în nginx)

## Lighthouse (baseline + regression gate)

- CI rulează Lighthouse gate pe PR-uri (vezi workflow-ul de Lighthouse).
- Local, rulează auditul și generează `app/public/lighthouse-scores.json` + `app/public/lighthouse-badge.svg`:

```bash
cd /root/solaris-cet
npm run lighthouse:audit
```

## Brotli la origin (nginx)

- Build-ul Vite emite automat fișiere `.br` pentru assets (JS/CSS/HTML etc.).
- Pentru nginx, există două variante:
  - `docker/nginx.conf`: `gzip` + `gzip_static on` (servește `.gz` dacă există)
  - `docker/nginx.brotli.conf`: `gzip` + `brotli` + `brotli_static on` (necesită modul Brotli în nginx)

## Redis: single node vs cluster

- În prezent, aplicația suportă Upstash Redis (REST) pentru rate limit + cache.
- Dacă un singur nod nu mai face față:
  - Upstash: treci pe plan cu throughput mai mare / multi-region dacă ai nevoie de latență mică global.
  - Self-hosted: rulează Redis Cluster/Sentinel în k8s sau într-un setup dedicat; aplicația folosește API REST Upstash, deci pentru self-hosted ai nevoie de un adapter (sau migrare la client Redis TCP în runtime Node).

## Scale-out aplicație (mai multe instanțe)

- Aplicația este stateless pentru UI și majoritatea API-urilor; poate fi scalată orizontal fără sticky sessions.
- Recomandat:
  - Nginx/Cloudflare LB în fața mai multor instanțe
  - Healthcheck: `GET /health.json`
  - Observability: `GET /api/metrics` (protejat cu token)

## Limitare concurență (AI) + degradare prietenoasă

- Rutele AI au limitare de concurență (global + per user/per IP) și returnează `503` cu `Retry-After` când instanța e aglomerată.
- Env-uri:
  - `CET_AI_CHAT_MAX_CONCURRENT_GLOBAL`, `CET_AI_CHAT_MAX_CONCURRENT_PER_IP`
  - `CET_AI_ASK_MAX_CONCURRENT_GLOBAL`, `CET_AI_ASK_MAX_CONCURRENT_PER_USER`

## Circuit breaker (AI providers)

- Pentru `/api/chat`, există circuit breaker per provider (Grok/Gemini) ca să nu mai încerce agresiv un provider care dă erori repetate.
- Pentru traffic mare, asta reduce latența și costul de retries.

## Caching la edge pentru resurse statice

- Origin setează `Cache-Control` pentru assets non-HTML ca `immutable` + `s-maxage`, astfel încât CDN-ul să poată cache-ui agresiv.

## Imagini (Cloudinary)

- Dacă vrei optimizare automată (AVIF/WebP, resizing, DPR):
  - Mută imaginile în Cloudinary și folosește transformări standard (`f_auto,q_auto,w_...`).
  - Pentru UI, păstrează `loading="lazy"` și `decoding="async"` (componenta `AppImage` deja face asta).

## Load test (k6 / Artillery)

- Artillery: `scripts/load-test.yml`
- k6:
  - rulează un smoke test pe rute critice (homepage + AI)
  - folosește un scenariu separat pentru 10k VUs doar în medii dedicate (cost + rate limits).

## DB: pooling, slow queries, indecși

- Pooling-ul Postgres este configurabil din env (max/timeouts).
- Pentru slow queries:
  - activează `pg_stat_statements`
  - verifică `EXPLAIN (ANALYZE, BUFFERS)` pe query-urile top
  - adaugă indecși doar când ai query pattern stabil

## Arhivare date vechi

- Pentru volume mari, recomand un job separat (cron) care mută rândurile vechi într-o masă de arhivă sau într-un storage rece.
- Rulele de retenție trebuie corelate cu raportare/audit.
