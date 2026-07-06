# Integrare Survey Engine + Platformă

## Structură monorepo (post-merge)

```
SOLARIS CET/
├── app/                 # React 19 + Vite (platformă web, TON, CET AI)
├── api/                 # API root-level
├── contracts/           # TON smart contracts
├── engine/              # Go farming engine (existent în platformă)
├── survey-engine/       # Python AI survey tool (Faze 0–4)
│   ├── src/             # pipeline, PDF, Claude, DeepSeek
│   ├── tests/
│   └── pyproject.toml
├── docs/                # Documentație unificată
└── package.json         # npm workspaces
```

## Bridge API

| Layer | URL | Rol |
|---|---|---|
| Python FastAPI | `http://127.0.0.1:8000` | Motor survey (poze → PDF) |
| Node proxy | `/api/survey/health` | Health check platformă → engine |
| Node proxy | `/api/survey/dashboard` | Dashboard rapoarte + costuri |

### Variabile mediu

```env
# survey-engine/.env
DEEPSEEK_API_KEY=
ANTHROPIC_API_KEY=

# app / Coolify
SURVEY_ENGINE_URL=http://127.0.0.1:8000
```

### Pornire locală

```bash
# Terminal 1 — survey engine
cd survey-engine && pip install -e ".[api,ui,dev]" && python -m uvicorn src.server:app --port 8000

# Terminal 2 — platformă
npm install && npm run app:dev
```

## Faza 5 — App tehnicieni + CRM (v1.0)

| Componentă | Rută | Rol |
|---|---|---|
| React Survey UI | `/survey` | Upload poze, checklist, profil instalator |
| Generate proxy | `/api/survey/generate` | Multipart → Python `/generate` |
| Files proxy | `/api/survey/files?file=` | Download PDF/AHJ |
| CRM hook | `/api/survey/crm` | Lead survey + email admin + push |
| Demo proxy | `/api/survey/demo` | Raport sample fără upload |
| Batch proxy | `/api/survey/batch` | Multipart manifest + poze `job_id__foto.jpg` |
| Admin CRM | `/api/admin/surveys` | Listă rapoarte + filtru instalator |
| Python generate | `POST /generate` | Pipeline complet photos → PDF |

### Multi-instalator

Profilul tehnicianului (`installerId`, `installerName`, `company`) se salvează în `localStorage` și se transmite la generare + CRM.

### Pornire completă (Faza 5)

```bash
# Terminal 1
npm run survey:api

# Terminal 2
npm run app:dev
# → http://localhost:5173/survey
```

### PWA offline (șantier)

- Draft formular + poze salvate în **IndexedDB** (auto-save la 600ms)
- Fără rețea: butonul devine **„Salvează în coadă (offline)”**
- La reconectare: banner cu **Sincronizează acum** pentru rapoarte în așteptare
- Service worker existent prefetch-uiește shell-ul offline

### Deploy Coolify (prod)

`docker/coolify.yml` include serviciul `survey-engine` alături de `frontend`:

| Serviciu | Port | Variabile runtime |
|---|---|---|
| `frontend` | 3000 | `SURVEY_ENGINE_URL=http://survey-engine:8000` |
| `survey-engine` | 8000 | `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY` |

Volume persistent: `survey_output` → `/app/output` (PDF-uri + registry).

Build survey-engine: `survey-engine/Dockerfile` (Python 3.12 + FastAPI).

Alternativ în Coolify UI: creează o aplicație separată din `survey-engine/Dockerfile` și setează
`SURVEY_ENGINE_URL` la URL-ul intern (ex. `http://survey-engine:8000`).

### Survey → Ofertă (`/contact`)

După generare raport, butonul **„Cere ofertă (contact)”** deschide `/contact?from=survey&...` cu:
- Nume, telefon, email, oraș precompletate
- Serviciu fotovoltaic + putere estimată din kWp
- Mesaj cu `report_id`, scor, capacitate

Calculatorul solar folosește același bridge (`contactPrefill.ts`) pentru `?service=fotovoltaice&...`.

## Faza 7–10 — Kimi, field intelligence, hardening, SaaS (v1.2)

| Componentă | Rută / env | Rol |
|---|---|---|
| Kimi vision (10+ poze) | `KIMI_API_KEY`, `KIMI_MODEL` | Routing automat în pipeline |
| Jurisdicții RO | `GET /jurisdictions` → `/api/survey/jurisdictions` | Județ + operator rețea pentru AHJ |
| GPS șantier | `site_latitude`, `site_longitude` în `/generate` | Browser geolocation + EXIF din poze |
| Statistici publice | `GET /stats` → `/api/survey/stats` | Rapoarte, scor mediu, per instalator |
| Installer API keys | `INSTALLER_API_KEYS` JSON | Header `X-Installer-Key` pe `/generate` și `/batch` |
| Rate limit | `SURVEY_RATE_LIMIT_PER_HOUR` | 429 după prag (implicit 60/h) |
| Webhook CRM | `SURVEY_WEBHOOK_URL` + `SURVEY_WEBHOOK_SECRET` | POST la lead nou din `/api/survey/crm` |
| Post-deploy smoke | `npm run survey:post-deploy` | Verifică health + jurisdictions + stats în prod |

### UI `/survey` (v1.2)

- Dropdown **Județ / jurisdicție AHJ** (lista din engine)
- Buton **Capturează GPS șantier**
- Câmp **Cheie API instalator** (profil tehnician, localStorage)

### Smoke & verificare

```bash
npm run survey:smoke          # engine local :8000
npm run survey:post-deploy    # SITE_URL=https://solaris-cet.com
```