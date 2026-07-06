# SOLARIS CET — Survey Engine (Python)

Motorul AI pentru evaluare șantier fotovoltaic: analiză poze, checklist, raport PDF, export AHJ.

**Parte din monorepo-ul Solaris CET** (`app/` = platformă web, `survey-engine/` = tool tehnicieni).

## Comenzi

```bash
cd survey-engine
pip install -e ".[api,ui,dev]"
python -m src.cli demo
python -m src.cli web
python -m src.cli batch -m tests/fixtures/batch_sample.json
python -m src.cli dashboard
python -m uvicorn src.server:app --port 8000
pytest tests/ -q
```

## API (FastAPI)

| Endpoint | Method | Descriere |
|---|---|---|
| `/health` | GET | Status engine + provider config |
| `/dashboard` | GET | Istoric rapoarte + costuri API |
| `/demo` | POST | Raport sample fără upload |
| `/generate` | POST | Multipart: poze + checklist + date client |
| `/files/{name}` | GET | Download PDF sau AHJ JSON (suportă subpath `batch/...`) |
| `/batch` | POST | Multipart: manifest JSON + poze `job_id__foto.jpg` |
| `/jurisdictions` | GET | Județe RO + operator rețea (AHJ) |
| `/stats` | GET | Statistici publice (rapoarte, scor, per instalator) |

## Bridge Node (`app/api/survey/*`)

| Proxy | Engine |
|---|---|
| `/api/survey/health` | `GET /health` |
| `/api/survey/dashboard` | `GET /dashboard` |
| `/api/survey/demo` | `POST /demo` |
| `/api/survey/generate` | `POST /generate` |
| `/api/survey/files?file=` | `GET /files/{name}` |
| `/api/survey/crm` | Persistă lead + webhook opțional |
| `/api/survey/jurisdictions` | `GET /jurisdictions` |
| `/api/survey/stats` | `GET /stats` |

## Variabile mediu

Copiază `.env.example` → `.env`:

- `DEEPSEEK_API_KEY` — vision + coding (worker principal)
- `ANTHROPIC_API_KEY` — Claude Sonnet/Fable (text premium)
- `KIMI_API_KEY` — long context multi-image (10+ poze)
- `KIMI_BASE_URL`, `KIMI_MODEL` — Moonshot API (opțional)
- `INSTALLER_API_KEYS` — JSON `{"INST-1":"secret"}` pentru SaaS
- `SURVEY_RATE_LIMIT_PER_HOUR` — rate limit per cheie/IP (default 60)
- `XAI_API_KEY` — Grok (opțional)

Platformă Node: `SURVEY_ENGINE_URL=http://127.0.0.1:8000`, `SURVEY_WEBHOOK_URL` (CRM webhook)

## Model routing (production)

| Job | Model | Cost |
|---|---|---|
| ≤6 poze, standard | DeepSeek V4 Pro | ~$0.01–0.03/raport |
| Premium text rutină | Claude Sonnet 5 | ~$0.045/raport |
| Top-tier 15–20% | Claude Fable 5 (text only) | ~$0.22/raport |
| 10+ poze | Kimi | variabil |

## Faze livrate

- v0.1–v0.3: PDF design v6, DeepSeek vision, Gradio UI, AHJ export, batch, dashboard
- v1.0 (Faza 5): React `/survey`, CRM, PWA offline, Coolify deploy
- v1.1 (Faza 6): Batch multi-site, cost budget alerts, calculator→survey, admin analytics, Telegram CRM
- v1.2 (Faza 7–10): Kimi routing, EXIF/GPS, jurisdicții RO, webhooks, installer keys, rate limit, stats publice

## Teste

```bash
pytest tests/ -q   # 62+ teste
npm run survey:smoke
npm run survey:post-deploy   # după deploy Coolify
```

CI: job `survey-engine` în `.github/workflows/ci.yml`