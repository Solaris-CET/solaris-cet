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

**Skill agent:** `.claude/skills/solaris-perfect-loops/SKILL.md` — Loops v3 + **v4 consulting** (BCG Field Service, Deploy-Reshape-Invent, OODA). Master: `SOLARIS-LOOPS-MASTER.md` · Soluții piață: `CONSULTING-SOLUTIONS.md` · **GTM:** `GO-TO-MARKET-STRATEGY.md` (v3.3, Rule of 3×3)

**Loops CLI:** `loops:next` · `loops:status` · `loops:refine` (DeepSeek) · `aider` (Aider wrapper)

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

## Epic installer-twin-deploy (D10 UI + Installer SaaS) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| Installer registry | `installer_registry.py` · `GET /installers` · `GET /installer/me` |
| Node bridge | `/api/survey/installer/me` · `/api/admin/installers` |
| Twin UI | `TwinFeedPanel.tsx` + `twinFeedMap.ts` în SurveyPage |
| Admin instalatori | `InstallersSection.tsx` + nav fix `newLeadsCount` |
| Deploy gate | `post-deploy-survey.mjs` (context, openapi, twin) · `survey-bridge-smoke.mjs` |
| OpenAPI + SDK | `/api/survey/installer/me` · `client.survey.installerMe()` |

**VERIFY:** pytest installer_registry · Vitest installerApi + twinFeedMap · E2E twin panel

## Epic d10-twin-runtime (D10 live layer) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| Event log | `twin_runtime.py` · `twin_events.jsonl` |
| SSE stream | `GET /twin-stream/{id}` · `/api/survey/twin-stream` |
| Events API | `GET /twin-events` · `/api/survey/twin-events` |
| UI live | `TwinRuntimePanel` + `useTwinStream` + `TwinMapViewer` |
| Admin | `TwinMonitorSection` |
| Webhook | `twin_feed_updated` pe POST corrections |

**VERIFY:** pytest twin_runtime · Vitest twinRuntimeApi · smoke S7 twin-events/stream

## Epic prod-deploy-gate (D6 deploy) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| Prod gate | `scripts/survey-prod-gate.mjs` + `surveyRouteManifest.mjs` |
| Post-deploy | `post-deploy.mjs` + `post-deploy-survey.mjs` → gate |
| Coolify | `coolify-redeploy-survey.mjs` + `coolify-deploy-by-tag.sh` |
| Gitea retry | `gitea-push-retry.mjs` |
| Status | `deploy-status.mjs` |
| Smoke extins | `smoke-http.mjs` survey health · `stash-verify` prod gate |

**VERIFY:** `survey-route-manifest.test.mjs` · Vitest `surveyProdGate.test.ts`

## Epic twin-crm-webhooks (D10 3D + CRM bidirectional) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| Persistent SSE | `iter_sse_persistent_stream()` · `?persistent=1` · heartbeat |
| 3D viewer | `Twin3DViewer.tsx` + `twin3dScene.ts` · toggle în `TwinRuntimePanel` |
| Outbound CRM | `twin_webhook.py` · `TWIN_WEBHOOK_URL` · hook `publish_twin_event` |
| Inbound CRM | `POST /twin-webhook/inbound` · `POST /api/survey/twin-webhook` |
| Delivery log | `GET /twin-webhook/deliveries` · Admin `TwinWebhookSection` |
| SDK | `twinWebhookDeliveries()` · `postTwinWebhook()` |

**VERIFY:** pytest twin_webhook + persistent SSE · Vitest useTwinStream + twin3dScene · smoke S8

## Epic twin-ai-agent (D10 + S5 agent layer) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| Agent core | `twin_agent.py` · schema `solaris-twin-agent-v1` |
| Plan API | `GET /twin-agent/{id}` · `/api/survey/twin-agent` |
| Execute | `POST /twin-agent/{id}/execute` · webhooks `agent_action` |
| Decisions | `GET /twin-agent/decisions` · Admin `TwinAgentSection` |
| UI | `TwinAgentPanel` + `useTwinAgent` în SurveyPage |
| Events | `agent_plan_ready` · `agent_action` · `agent_reassess` |
| SDK | `twinAgent()` · `executeTwinAgentAction()` |

**VERIFY:** pytest `test_twin_agent` · Vitest twinAgent · smoke S9

## Epic survey-offline-pwa (D1 field PWA) — 2026-07-06 DONE

| Componentă | Locație |
|---|---|
| IndexedDB queue | `surveyDraftStorage.ts` — status + retry |
| Sync hook | `useSurveyOfflineSync.ts` |
| UI panel | `SurveyOfflinePanel.tsx` în SurveyPage |
| SW precache | `sw.js` `/survey` + `PROBE_SURVEY_SHELL` |
| Manifest API | `GET /offline-hints` · `/api/survey/offline-manifest` |
| Admin | `SurveyOfflineSection` |

**VERIFY:** pytest `test_survey_offline` · Vitest manifest/queue · Playwright offline queue · smoke S10

## Epic refactor-verify-gate (Kimi + Grok handoff) — 2026-07-08 DONE

| Componentă | Locație |
|---|---|
| DeepSeek v4-pro | `app/api/lib/publicChat.ts` · `scripts/deepseek-refine.mjs` |
| Admin auth guards | `app/api/lib/adminAuth.ts` → `guardAdminRoute` + test mocks |
| App modularization | `App.tsx` → `routing.ts` · `seoEngine.ts` · `Router.tsx` |
| robots.txt persist | `app/scripts/generate-seo-files.mjs` — disallow privacy/multumim/cdn-cgi |
| Verify gate | `npm run verify` — 1827 tests · lint · typecheck · build |

**VERIFY:** `npm run verify` (app) · commit `e81ee69d` · GitHub `main` pushed

## Fable 5 leak reference + agent harness — 2026-07-08 DONE

| Componentă | Locație |
|---|---|
| Leak reference doc | `docs/planning/FABLE5-LEAK-REFERENCE.md` |
| Harness (effort / packets / verifier) | `survey-engine/src/agent_harness.py` |
| Claude effort routing | `survey-engine/src/api_clients/claude.py` |

**Source:** [CL4R1T4S / CLAUDE-FABLE-5.md](https://raw.githubusercontent.com/elder-plinius/CL4R1T4S/main/ANTHROPIC/CLAUDE-FABLE-5.md) — public, no DM funnel.

**VERIFY:** pytest `test_agent_harness`

## Graphify codebase map (all agents) — 2026-07-08 DONE

| Componentă | Locație |
|---|---|
| Skill (agents) | `.agents/skills/graphify/SKILL.md` |
| Skill (Claude) | `.claude/skills/graphify/SKILL.md` |
| Cursor rule | `.cursor/rules/graphify.mdc` (`alwaysApply: true`) |
| CLI prime | `npm run graphify:prime` · `graphify:build` · `graphify:update` |
| Upstream | https://github.com/Graphify-Labs/graphify · PyPI `graphifyy` |

**Workflow:** query graph **before** Read/Grep; `graphify update` after code edits (AST-only, no API cost).
**Build:** code-only (`app` + `survey-engine` + `scripts` + `contracts`) — docs need LLM key for full semantic pass.

**VERIFY:** `npm run graphify:prime` · `python -m graphify query "survey CRM"`
