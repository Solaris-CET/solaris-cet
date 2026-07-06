# Performanță (runbook)

## Lighthouse

Audit local + generare badge/JSON:

```bash
cd /root/solaris-cet
npm run lighthouse:audit
```

Output:

- `app/public/lighthouse-scores.json`
- `app/public/lighthouse-badge.svg`

## Compresie + caching

- Build-ul Vite emite `.br` pentru assets.
- Nginx:
  - `docker/nginx.conf`: `gzip` + `gzip_static on` (servește `.gz` dacă există)
  - `docker/nginx.brotli.conf`: `gzip` + `brotli` + `brotli_static on` (necesită modul Brotli)

## Core Web Vitals (production)

- În UI, metricile CWV sunt colectate prin `web-vitals` și trimise ca evenimente analytics (cu gating pe consimțământ).

