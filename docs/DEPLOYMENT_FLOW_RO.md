# Flux deployment: local → staging → production

## Local

- Verificări rapide: `npm run verify:fast`
- Verificări complete (include E2E): `npm run verify:all`

Rulare locală (dev):

- App: `cd app && npm run dev`

Notă: pentru Vite 8 (rolldown) este necesar ca dependențele opționale să fie instalate (default la `npm ci`). Dacă rulezi `npm ci --omit=optional`, Vite poate eșua la runtime.

## Staging

- Deploy automat la PR: workflow-ul [deploy-staging-pr.yml](file:///root/solaris-cet/.github/workflows/deploy-staging-pr.yml) declanșează un webhook.
- Secret necesar în GitHub:
  - `STAGING_DEPLOY_HOOK_URL`

Recomandări:

- Folosește variabile de mediu distincte față de production.
- Verifică health: `GET /api/health`.

## Production

- Deploy prin Coolify/Docker (repo include `Dockerfile` + fișiere în `docker/`).
- Alternativ, există workflow de GitHub Pages pentru build + deploy (static).

## CI/CD (GitHub Actions)

### Calitate + E2E

- Workflow principal: [ci.yml](file:///root/solaris-cet/.github/workflows/ci.yml)
- Rulează lint/typecheck/unit + E2E Playwright.

### Contract tests (Pact)

- Workflow: [pact.yml](file:///root/solaris-cet/.github/workflows/pact.yml)
- Local:
  - `PACT_ENABLED=1 npm run test:contract --workspace=app`

### Static analysis (Sonar)

- Workflow: [sonar.yml](file:///root/solaris-cet/.github/workflows/sonar.yml)
- Secrete necesare:
  - `SONAR_HOST_URL`
  - `SONAR_TOKEN`

### Securitate (OWASP Top 10 / DAST)

- Workflow: [zap-dast.yml](file:///root/solaris-cet/.github/workflows/zap-dast.yml)
- Secret necesar:
  - `ZAP_TARGET_URL`

### Performance (Locust)

- Workflow: [locust.yml](file:///root/solaris-cet/.github/workflows/locust.yml)
- Rulează manual (`workflow_dispatch`) pe un host ales (de regulă staging).

