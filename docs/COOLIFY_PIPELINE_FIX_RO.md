# Fix pipeline Coolify (fără secrete în build)

## Scop

Build-ul Docker trebuie să fie determinist și să nu depindă de secrete. În Coolify, secretele se setează doar la runtime.

## 1) Curăță Build Args în Coolify

În UI Coolify (Application → Build / Build Arguments):

- Elimină complet `DATABASE_URL`, `ADMIN_BOOTSTRAP_PASSWORD` și orice chei/URL-uri sensibile.
- Păstrează doar variabile non-secrete necesare la build (ex. `VITE_*`, `GIT_SHA`, `BUILD_TIMESTAMP`).

## 2) Pune secretele la runtime

În UI Coolify (Application → Environment / Secrets), setează la runtime:

- `DATABASE_URL`
- `JWT_SECRET` (și/sau `JWT_SECRETS`)
- `ENCRYPTION_SECRET`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

Opțional (dacă folosești funcțiile respective):

- `GEMINI_API_KEY`, `GROK_API_KEY`, `TAVILY_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`
- `METRICS_TOKEN`

## 3) Repo: build args “sigure” în Dockerfile

`Dockerfile` acceptă explicit build args pentru `VITE_*` și metadata (`GIT_SHA`, `BUILD_TIMESTAMP`) și le expune ca `ENV` în build stage, fără a cere secrete.

## 4) Repo: Compose Coolify fără secrete în YAML

`docker/coolify.yml` nu listează secrete în `frontend.environment`. Secretele se setează în Coolify UI la runtime.

## 5) Docker context / rețea (diagnostic rapid pe host)

Rulare pe server (SSH), ca să confirmi host networking și mapările `--add-host`:

```bash
ip addr
ip route
getent hosts host.docker.internal || true
getent hosts postgres || true
docker network ls
docker ps -a --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
```

## 6) Curățare build cache și redeploy

Rulare pe server (atenție: curăță cache/imagini nefolosite):

```bash
docker builder prune -af
docker system prune -af --volumes
```

În Coolify, redeclanșează deployment cu opțiunea "No Cache".

## 7) Dacă build-ul moare brusc (Exit Code 255 / OOM)

Simptom tipic: logul se oprește imediat după `npm ci`, înainte de `npm run build`, iar sesiunea de exec e terminată (exit 255). Cel mai des este un kill de memorie (OOM) în containerul de build.

Recomandări:

- În Coolify, crește limita de memorie pentru build (dacă există setare de resources/limits pentru build container).
- Activează/crește swap pe host (Hetzner) ca să absoarbă spike-urile de la `next build`.

Comenzi pe server (SSH) pentru swap (exemplu 8GB):

```bash
sudo fallocate -l 8G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
swapon --show
free -h
```

Note:

- Dacă ai limită strictă în Coolify pentru containerul de build, swap-ul host poate să nu fie suficient; atunci trebuie ridicată limita de memorie.
- În repo, `Dockerfile` setează `NODE_OPTIONS=--max-old-space-size=4096` pentru a limita vârful de heap în timpul build-ului.
