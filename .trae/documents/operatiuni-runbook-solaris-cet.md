## 1) Componente + dependențe (operațional)

### Componente principale
- SPA (React/Vite): UI, navigație, logica de client, PWA.
- Server Node: servește `app/dist`, expune `/api/*` și `/metrics`.
- API handlers (edge-style): logică pentru AI, TON, auth, audit, cache, health/metrics.
- PostgreSQL: persistență (users/sessions/mining/transactions/audit).
- Upstash Redis: rate limiting (protecție abuz / cost control pentru LLM).
- Observability: Sentry (erori), Prometheus metrics (`/metrics`), probe externe (GitHub Actions uptime).

### Dependențe critice (SLA)
- LLM: Grok + Gemini (fallback între provideri pentru disponibilitate).
- TON/DeDust/TON Center: date on-chain (degradare grațioasă dacă sunt indisponibile).

## 2) Feature flags

### Principii
- Default: flags „off” pentru funcții riscante; „on” doar după validare.
- Flags trebuie să fie: documentate, testabile, observabile (log/metric), reversibile rapid.

### Tipuri de flags (recomandat pentru acest proiect)
1) **Build-time flags (VITE_*)**
   - Folosești `import.meta.env.VITE_*` pentru toggles care acceptă rebuild.
   - Exemple: `VITE_LHCI`, `VITE_GOOGLE_SITE_VERIFICATION`, `VITE_GIT_COMMIT_HASH`.
2) **Runtime flags (recomandat pentru A/B + rollout rapid)**
   - Endpoint dedicat: `GET /api/flags` (JSON) cu cache scurt (ex: 30–120s).
   - Sursă de adevăr: tabel DB `feature_flags` (sau JSON semnat în repo, dacă vrei fără DB).
   - Protecție: allowlist de origini + rate limit.

### Contract minim pentru flags (propunere)
```ts
export type FeatureFlagValue = boolean | number | string;
export type FeatureFlags = Record<string, FeatureFlagValue>;
```

## 3) A/B testing

### Bucketing determinist (fără cookie-uri third-party)
- Folosești seed per sesiune + per rută (există deja mecanism de seed) pentru a atribui variantă stabilă.
- Algoritm: `variant = hash(userOrSessionSeed + experimentKey) % N`.

### Ce loghezi (minim)
- **Exposure event**: experiment_key, variant, route, timestamp.
- **Conversion event**: event_name (ex: signup/waitlist/click), experiment_key, variant.

### Metrici recomandate
- CTR pe CTA principal, scroll depth, completion rate pentru widget CET AI, timp până la interacțiune.

## 4) Staging identic cu producția (environment parity)

### Regulă de aur
- **Build once, promote**: același artefact (bundle + API build) este promovat din staging în producție.

### Paritate de infrastructură
- Staging folosește aceleași tipuri de resurse ca producția:
  - aceeași versiune Node, același entrypoint (server Node), aceleași probe de health.
  - aceeași topologie (static + API + DB + Redis), doar endpoint-uri/credite separate.

### Date & secrete
- DB staging separată (nu clona producția fără mascarea datelor).
- Chei LLM separate pe medii (quota/cost control).
- `METRICS_TOKEN`, `SENTRY_DSN`, `DATABASE_URL`, `UPSTASH_*`, `JWT_SECRET(S)` diferite per mediu.

## 5) Deployment workflow (recomandat)

### Flux Git
1) PR → `main`
2) CI (lint/typecheck/unit/e2e) trebuie să fie verde.
3) Build artefact
4) Deploy în **staging** automat (canary)
5) Probe: `/health.json`, `/api/health`, `/api/metrics`, `/metrics`
6) Promote în **production** (manual approval + release tag)

### Rollback
- **Fast rollback**: redeploy la artefact-ul anterior (ultimul SHA stabil).
- **Config rollback**: dezactivezi flags/experimentele runtime imediat.

## 6) Incident response

### Severități
- SEV1: site indisponibil / tranzacții sau auth complet căzute / leak de secrete.
- SEV2: degradare majoră (CET AI indisponibil, rate limit eronat, TON API down).
- SEV3: bug-uri UI fără impact critic.

### Checklist (primele 10 minute)
1) Confirmă impact (probe uptime + repro rapid).
2) Verifică `/api/health` pentru configurări lipsă.
3) Verifică `/metrics` (erori/latency) + Sentry (stack traces).
4) Dacă e legat de LLM/TON: activează degradare (fallback / disable feature).
5) Dacă e regresie: rollback la SHA anterior.
6) Comunicări: status update inițial + ETA (chiar dacă e „investigăm”).

### Runbook-uri scurte (simptome → acțiune)
- **/api/chat 5xx** → verifică cheile (enc/plain), Upstash rate limit, timeout extern; dezactivează experiment/feature dacă e cauzat de rollout.
- **/api/health arată „missing”** → variabile lipsă în runtime; reconfigurează environment.
- **DB down** → comută aplicația în mod read-only (dacă e posibil), degradează funcțiile care scriu (mining/transactions/audit).
- **Spike trafic/bot** → crește agresivitatea rate limit, activează challenge la edge (dacă există), monitorizează cost LLM.

### Post-incident
- Postmortem în 48h: timeline, root cause, acțiuni preventive (tests, alerts, flags,