# SOLARIS CET - Global Project Documentation

**Project:** AI-Powered Solar Site Survey & Report Assistant  
**Version:** MVP v0.1 + Multi-Model Costed Architecture (Claude Fable 5)  
**Date:** 2026-07-05  
**Status:** Updated with exact latest model from Claude Console

## Tech Stack & Model Routing Strategy (Final)

**Primary Brain & Orchestrator:** Grok Heavy (xAI)

**Main Heavy Worker:** DeepSeek V4 Pro (coding, vision extraction, checklist processing)

**High-Quality Writing & Complex Reasoning Specialist:**  
**Claude Fable 5** (Anthropic) — **Cel mai capabil model actual**  
- Poziționat ca: Most capable, Research, Multi-day tasks  
- **Buget:** ~20 € / lună (ai deja $20.41 credite active în Claude Console)  
- **Preț real API:** $10 / 1M tokeni input, $50 / 1M tokeni output (~$0.22 per raport premium la effort medium)  
- **Când îl folosim:** 
  - Scriere finală top-tier (clienți mari, AHJ pretențioase, analize complexe)
  - Research și situații ambigue
  - **NU pentru poze** (vision rămâne pe DeepSeek/Kimi) și NU pentru texte premium de rutină — acolo folosim **Claude Sonnet 5** ($2/$10 intro până la 31 aug 2026, de 5× mai ieftin, calitate aproape identică la scriere)
- **Detalii complete de buget și reguli de eficiență:** vezi `BUGET_FABLE5_API.md`

**Long-Context + Multi-Image Specialist:**  
**Kimi** (Moonshot AI)  
- **Buget:** ~20 € / lună API credits  
- **Când îl folosim:** 8–20+ poze + documente lungi într-o singură analiză

**Total cost estimat Claude Fable 5 + Kimi:** ~40 € / lună la usage moderat-greu.

### Model Routing Clar (Production)

| Job Type                      | Model Principal      | Motiv                              |
|-------------------------------|----------------------|------------------------------------|
| Standard (≤6 poze)            | DeepSeek V4 Pro      | Rapid + ieftin + excelent vision   |
| Premium text (rutină)         | **Claude Sonnet 5**  | $2/$10 intro — 5× mai ieftin, calitate aproape de Fable la scriere |
| Premium top-tier + research   | **Claude Fable 5**   | Cel mai bun la scriere & reasoning ($10/$50) — doar text, fără poze |
| Multe poze + context lung     | Kimi                 | Cel mai bun long-context + multi-image |
| Planificare + review final    | Grok Heavy           | Orchestrator + calitate finală     |

**Last Updated:** 2026-07-05 — Actualizat cu **Claude Fable 5** conform dashboard-ului tău Claude Console (Fable 5 = Most capable model).

---

## Status livrare Faza 5 (v1.0) — 2026-07-05

| Componentă | Status | Locație |
|---|---|---|
| App tehnicieni `/survey` | ✅ | `app/src/pages_legacy/SurveyPage.tsx` |
| Upload poze + checklist + profil instalator | ✅ | IndexedDB draft + coadă offline |
| Generate PDF + AHJ | ✅ | `survey-engine` → `/api/survey/generate` |
| CRM survey leads | ✅ | `/api/survey/crm` + admin LeadsSection |
| Multi-instalator | ✅ | `installer_id` în pipeline + dashboard stats |
| PWA offline șantier | ✅ | Draft IndexedDB + sync queue |
| Survey → ofertă contact | ✅ | `contactPrefill.ts` → `/contact?from=survey` |
| Deploy Coolify | ✅ | `survey-engine/Dockerfile` + `docker/coolify.yml` |

**Teste:** 48/48 pytest (`survey-engine`) · Vitest survey + contactPrefill

**Skill agent:** `.claude/skills/solaris-perfect-loops/SKILL.md` — Loops v3 + **v4 consulting** (BCG Field Service, Deploy-Reshape-Invent, OODA). Master: `SOLARIS-LOOPS-MASTER.md` · Soluții piață: `CONSULTING-SOLUTIONS.md`

**Agent memory (Stash):** `docs/planning/agent-memory.md` + [Fergana Stash](https://github.com/fergana-labs/stash). Comenzi: `npm run stash:prime -- <topic>` (înainte) · `npm run stash:sync` (după) · `npm run stash:verify` (audit).

**Local dev (Windows):** `npm run dev:local` — survey :8000 + Node API :3000 + Vite :5173 (+ proxy `/api`). Nu 3 terminale manuale.

**Windows dev:** `npm run ci:install` (rimraf + retry npm ci + husky) — sau **Dev Container** (recomandat, identic CI). Nu rula instalări npm în paralel.

**Variabile prod:** `SURVEY_ENGINE_URL=http://survey-engine:8000`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `LEAD_STORAGE_DIR=/data/leads`

**Perfect Loops (2026-07-05):** auto-sync offline, quote↔survey CRM link, CI pytest, footer+sitemap `/survey`, E2E smoke, husky Windows-safe

**Verificare 2026-07-06:** pytest 48/48 · Vitest survey 12/12 · smoke OK · `run-bin.mjs` pentru npm pe Windows (cale cu spații)

## Epic soft-cost-platform (T1–T6) — 2026-07-06 DONE

| Task | Livrabil | API |
|---|---|---|
| T1 ROI admin | `soft_cost_roi.py` + LeadsSection | `/stats` |
| T2 Context unificat | `context_api.py` | `GET /context/{id}` · `/api/survey/context` |
| T3 Explainable | `explainable.py` + PDF „Basis of opinion” | AHJ `explainable_findings` |
| T4 Permit ZIP | `build_permit_zip` | `/permit-pack/{id}` · `/api/survey/permit-pack` |
| T5 Corecții tehnician | `corrections.jsonl` + SurveyPage | `POST /corrections` |
| T6 Retro BCG | `CONSULTING-SOLUTIONS.md` mapping S1–S6 | `stash:sync` |

**BCG Reshape:** factor 1 (data layer) + factor 3 (adaptive) + factor 4 (explainability) livrate în cod.

## Epic agentic-orchestration (S5) — 2026-07-06 DONE

| Componentă | API / fișier |
|---|---|
| Permit risk scorer | `assess_permit_risk()` |
| OODA plan | `GET /orchestrate/{id}` · `/api/survey/orchestrate` |
| Auto-CRM post-generare | `SurveyPage` + `orchestration.auto_crm` |

## Epic api-first-platform (S6 + D10 prep) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| OpenAPI survey spec | `/api/openapi/survey` + merge în v2 |
| Digital twin feed | `twin_feed.py` · `/api/survey/twin-feed` |
| Admin insights | `/api/admin/survey-insights` + badge low-confidence |
| Route registry fix | `server/index.cjs` — context, orchestrate, permit, corrections, twin |
| SDK | `publicApiSdk.survey.*` |
| Webhook | `survey_orchestration_complete` |

## Status livrare Faza 6 (v1.1) — 2026-07-06

| Componentă | Status | Locație |
|---|---|---|
| Batch multi-șantier | ✅ | `POST /batch` + tab Batch în `/survey` |
| Cost budget alerts | ✅ | `SURVEY_COST_BUDGET_USD` în `/health` |
| Calculator → survey | ✅ | `surveyPrefill.ts` + buton în `SolarCalculatorPage` |
| Admin analytics | ✅ | `LeadsSection` + cost per provider |
| Telegram CRM | ✅ | `api/lib/telegramNotify.ts` |
| Deploy stack script | ✅ | `npm run survey:deploy` |
| Fișiere batch download | ✅ | `/files/{path}` subpath safe |

## Status livrare Faza 7–10 (v1.2) — 2026-07-06

| Faza | Componentă | Status | Locație |
|---|---|---|---|
| **7** | Kimi multi-image (10+ poze) | ✅ | `survey-engine/src/api_clients/kimi.py`, `model_router.py` |
| **7** | Pipeline routing Kimi | ✅ | `survey-engine/src/pipeline.py` |
| **8** | EXIF/GPS din poze | ✅ | `survey-engine/src/photo_metadata.py` |
| **8** | Jurisdicții RO + operator rețea | ✅ | `survey-engine/src/jurisdictions.py`, `/jurisdictions` |
| **8** | AHJ export cu GPS + jurisdicție | ✅ | `ahj_export.py`, `ReportMetadata` |
| **9** | Webhook CRM | ✅ | `app/api/lib/surveyWebhook.ts` → `SURVEY_WEBHOOK_URL` |
| **9** | Post-deploy smoke | ✅ | `npm run survey:post-deploy` |
| **9** | E2E batch + calculator | ✅ | `app/tests/survey.spec.ts` |
| **10** | Installer API keys | ✅ | `INSTALLER_API_KEYS`, header `X-Installer-Key` |
| **10** | Rate limiting | ✅ | `survey-engine/src/rate_limit.py` (60/h implicit) |
| **10** | Statistici publice | ✅ | `GET /stats` → `/api/survey/stats` |
| **T1** | Soft Cost ROI admin | ✅ | `soft_cost_roi.py` + `LeadsSection` dashboard |
| **UI** | Dropdown județ + GPS șantier | ✅ | `SurveyPage.tsx` |
| **UI** | Cheie API instalator (localStorage) | ✅ | Profil tehnician |

**Teste:** pytest 62+ · Vitest survey routes · E2E smoke batch/calculator

**Env noi:** `KIMI_*`, `INSTALLER_API_KEYS`, `SURVEY_RATE_LIMIT_PER_HOUR`, `SURVEY_WEBHOOK_URL`, `SURVEY_WEBHOOK_SECRET`
