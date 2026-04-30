# Coolify (prod) — solaris-cet.com

## Realitatea repo-ului

- Aplicația nu este Next.js. Este Vite (frontend) + server Node (`app/server/index.cjs`) care servește `app/dist` și rute API din `app/.api-dist`.
- `package.json` cere Node `>=22` (local + build). Dacă rulezi cu Node 20 pe host, e probabil să ai build-uri instabile.
- În Coolify, varianta recomandată este build & run din `Dockerfile`, caz în care Node/npm instalate pe host devin irelevante (contează doar motorul Docker).

## 1) Verificări rapide pe server (Holtzer)

```bash
node -v
corepack --version || true
npm -v || true
docker -v
docker compose version || true
```

Alternativ (un singur script):

```bash
chmod +x scripts/host-preflight.sh
./scripts/host-preflight.sh
```

Recomandat: Node `22.x` (nu `20.x`) dacă faci build pe host.

## 2) Coolify: setare aplicație (recomandat: Dockerfile)

În Coolify, creează un “Application” din repo-ul Git și folosește build bazat pe `Dockerfile` (root).

Setări esențiale:

- Port intern: `3000`
- Healthcheck: `GET /health.json`
- Autodeploy: ON (la push pe branch-ul de producție)

Fișier util pentru import ca Docker Compose: `docker/coolify.yml`.

## 3) Domeniu + SSL automat

- Adaugă domeniul: `solaris-cet.com`
- Activează “Automatic SSL” (Let’s Encrypt) în Coolify
- Verifică redirect / HSTS:

```bash
curl -I https://solaris-cet.com/health.json | egrep -i 'HTTP/|strict-transport-security|location'
```

## 4) Variabile de mediu (Coolify)

Regulă:

- Buildtime: doar `VITE_*`
- Runtime: toate secretele + config backend

### Buildtime (ON la build)

- `VITE_PUBLIC_SITE_URL`
- `VITE_GOOGLE_SITE_VERIFICATION` (opțional)
- `VITE_GIT_COMMIT_HASH` (opțional; altfel se citește din `git` la build)
- `VITE_BUILD_TIMESTAMP` (opțional)
- `VITE_UX_TEST_SRC` (opțional)

### Runtime (ON la runtime, OFF la build)

- DB: `DATABASE_URL`
- JWT: `JWT_SECRET` (sau `JWT_SECRETS`)
- TON: `TONCENTER_RPC_URL`, `TONCENTER_API_KEY` (opțional)
- AI: `ENCRYPTION_SECRET` (recomandat) + (`GROK_API_KEY_ENC`/`GROK_API_KEY`) + (`GEMINI_API_KEY_ENC`/`GEMINI_API_KEY`)
- AI web retrieval (opțional): `CET_AI_ENABLE_WEB=1`, `CET_AI_WEB_ALLOWLIST`, `TAVILY_API_KEY_ENC`/`TAVILY_API_KEY`
- Observabilitate (opțional): `METRICS_TOKEN`, `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`
- Waitlist (opțional): `WAITLIST_WEBHOOK_URL`
- Cron/jobs (opțional): `CRON_SECRET` (header `x-cron-secret`) și/sau `CRON_TOKEN` (query `?token=` / `Authorization: Bearer`).

După update, fă `Redeploy`.

## 5) Webhook Git pentru deploy automat

În Coolify:

- Activează “Auto Deploy” pentru branch-ul de producție.
- Dacă folosești GitHub webhooks, folosește URL-ul de webhook generat de Coolify.

Validare: fă un push pe branch-ul de producție și verifică în Coolify că a pornit un nou deployment.

## 6) Reverse proxy (nginx) în fața aplicației

În mod normal, Coolify rulează un reverse proxy (Traefik/Caddy) și nu ai nevoie de nginx separat.

Dacă insiști pe nginx pe host (în afara Coolify), minimul pentru proxy către aplicație pe `127.0.0.1:3000`:

```nginx
server {
  listen 80;
  server_name solaris-cet.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
  }
}
```

## 7) Backup DB zilnic (cron)

Recomandat în Coolify: un “Scheduled job / service” separat cu `postgres:16-alpine` care rulează `pg_dump` (vezi `docs/OPS_BACKUPS.md`).

Variantă rapidă (import ca Compose în Coolify): `docker/coolify.backup.yml`.

Pentru cron pe host:

```bash
sudo install -d -m 0700 /var/backups/solaris-cet
sudo chmod +x /root/solaris-cet/scripts/pg-backup.sh
```

Exemplu (03:15 UTC zilnic):

```cron
15 3 * * * BACKUP_DIR=/var/backups/solaris-cet BACKUP_PREFIX=solaris-cet BACKUP_KEEP_DAYS=14 BACKUP_PASSPHRASE='***' DATABASE_URL='***' /root/solaris-cet/scripts/pg-backup.sh >/var/log/solaris-cet-db-backup.log 2>&1
```

## 8) Notificări deploy pe Telegram

În Coolify (recomandat): setează env runtime:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_THREAD_ID` (opțional)

Și rulează ca “Post deploy command”:

```bash
node scripts/post-deploy.mjs
```

Script: `scripts/post-deploy.mjs` (trimite și statusul `health.json`).

## 9) Test end-to-end (deployment pipeline)

Notă: poți rula și `node scripts/check-env.mjs --profile=admin,ai,metrics` pentru validare rapidă a env-urilor.

1) Fă o modificare mică (ex: bump `app/public/health.json` `version`) și dă push.
2) Confirmă în Coolify că deployment-ul pornește automat.
3) Confirmă public:

```bash
curl -fsS https://solaris-cet.com/health.json | head -c 300
echo
curl -fsS https://solaris-cet.com/api/metrics | egrep 'solaris_(ai|db|ton)_configured|solaris_build_info' | head -n 80
echo
curl -fsS https://solaris-cet.com/metrics | head -n 40
echo
```

## 10) Rollback rapid (re-deploy la ultima imagine stabilă)

În UI (rapid): Application → Deployments → alege ultimul deployment bun → Rollback.

Script (API, după tag):

```bash
COOLIFY_BASE_URL='https://coolify.example.com' \
COOLIFY_API_TOKEN='***' \
COOLIFY_RESOURCE_UUID='***' \
COOLIFY_TAG='stable-2026-04-25' \
node -v >/dev/null && bash scripts/coolify-deploy-by-tag.sh
```

Pentru “ultima stabilă” dintr-un fișier (host):

```bash
sudo install -d -m 0755 /var/lib/solaris-cet
echo 'stable-2026-04-25' | sudo tee /var/lib/solaris-cet/last-stable-tag
COOLIFY_BASE_URL='https://coolify.example.com' COOLIFY_API_TOKEN='***' COOLIFY_RESOURCE_UUID='***' sudo -E bash scripts/coolify-rollback.sh
```

## Referințe din repo

- `RUNBOOK_PROD.md` (env rules + probe-uri)
- `docs/DEPLOY_CHECKLIST.md` (post-deploy checks)
- `docs/OPS_BACKUPS.md` (backup/restore drill)
