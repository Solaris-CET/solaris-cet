# SOLARIS CET - Grok PM Notes

## Update 2026-07-05 (după screenshot Claude Console)

**Confirmare importantă de la tine:**
- Claude latest = **Claude Fable 5**
- Ai deja **$20.41 credite** active (se potrivește perfect cu bugetul de ~20€/lună)

**Acțiune:** Am actualizat global.md cu modelul exact **Claude Fable 5** ca specialist pentru high-quality writing & complex reasoning.

Fable 5 este poziționat perfect pentru noi:
- "Most capable"
- Research
- Multi-day tasks

Ideal pentru:
- Executive summaries premium
- Recommendations detaliate și profesionale
- Când vrem ca raportul final să arate ca și cum l-ar fi scris un consultant senior

**Routing final confirmat:**
- DeepSeek → default (ieftin + rapid)
- **Claude Fable 5** → calitate maximă text
- Kimi → long context + multe poze
- Grok → orchestrare + review

Totul e acum aliniat cu dashboard-ul tău real de la Claude.

Gata să testăm Fable 5 pe un prompt de analiză sau să continuăm cu UI-ul.

---

## Update 2026-07-05 — Faza 5 completă + Perfect Loops

**Livrat (fără fire lăsate în urmă):**
- Merge monorepo: `survey-engine/` + platformă React (`app/`)
- `/survey` end-to-end: poze → AI → PDF → CRM
- PWA offline: draft + coadă sync pe șantier
- Survey → ofertă: buton „Cere ofertă” → `/contact` precompletat (`contactPrefill.ts`)
- Coolify: serviciu Python `survey-engine` alături de frontend
- Skill: `solaris-perfect-loops` instalat în `.claude/skills/`

**Reguli noi (Perfect Loops — nu negocia):**
1. **Research Loop** înainte de orice feature nou — citește `global.md` + `grok.md`
2. **Build Loop** — cod + teste + docs în același commit, nu „starting point”
3. **Optimization Loop** — DeepSeek pentru volum, Fable 5 doar top-tier 15–20%
4. **Agent Loop** — Grok = manager/review, DeepSeek = worker greu
5. **Feedback Loop** — feedback user → update imediat în `grok.md`
6. **Retrospective Loop** — după fiecare task: greșeală → fix permanent → update grok.md/global.md

**Erori evitate:**
- `npm ci` pe Windows: folosește `npm run ci:win`, nu instalări paralele
- `npm install --package-lock-only` fără `--ignore-scripts` → husky eșuează fără node_modules
- Lockfile `@rolldown/binding-linux-x64-gnu` trebuie `resolved`+`integrity` pentru CI

**Următorul pas logic:** deploy pe VPS (Coolify) + test E2E cu poze reale de șantier.

---

## Update 2026-07-05 — Perfect Loops audit & hardening

**Îmbunătățiri aplicate (fără jumătăți de măsură):**

| Gap | Fix |
|---|---|
| Offline sync manual | Auto-sync la reconectare în `SurveyPage.tsx` |
| Quote fără legătură survey | `surveyReportId` în POST + tag în mesaj + admin CRM |
| pytest absent din CI | Job `survey-engine` în `ci.yml` + `verify:fast` |
| `/survey` invizibil | Footer + sitemap SEO |
| CRM leads pierdute la restart | Volume `leads_data` în `coolify.yml` |
| husky fail Windows | `scripts/prepare-husky.mjs` |
| README survey incomplet | Endpoint table + bridge Node + routing |
| E2E survey lipsă | `app/tests/survey.spec.ts` |

**Regulă nouă:** Orice feature survey trebuie să aibă: pytest + Vitest route test + E2E smoke + doc în `global.md`.

**Dev Windows (2026-07-05):** Preferă **Dev Container** (Linux = identic CI). Local Windows: `npm run ci:install` (rimraf + retry npm ci). Nu rula instalări npm în paralel.

---

## Update 2026-07-06 — Verificare finală Faza 5 (autonom)

**Teste rulate (toate verzi):**

| Suite | Rezultat |
|---|---|
| pytest `survey-engine` | **48/48** |
| Vitest survey + contactPrefill + draft | **12/12** (+4 route, +7 prefill, +1 api) |
| Smoke `npm run survey:smoke` | health + dashboard + demo OK |

**Fix-uri aplicate:**
- `leads` adăugat în `AdminSectionKey` (admin CRM tip-safe)
- `LeadsSection` — `useCallback` pentru `load` (lint hooks)
- `scripts/run-bin.mjs` — npm scripts Windows-safe (cale cu spații `SOLARIS CET`)
- `app/package.json` — lint/test/typecheck/dev folosesc `run-bin.mjs`
- SEO regenerat — `/survey` în `sitemap.xml`

**Deploy VPS:** config Coolify gata (`docker/coolify.yml` + `.env.production.example`). Necesită acces Coolify + secrets pe server — nu executat din sesiunea locală.

**Comenzi zilnice:**
```bash
npm run survey:api    # :8000
npm run app:dev       # :5173
npm run survey:smoke
npm run survey:test
cd app && npm run test -- src/__tests__/survey*.test.ts src/__tests__/contactPrefill.test.ts
```

---

## Update 2026-07-06 — Faza 6 (Production Scale v1.1)

**Livrat:**
- Batch API + UI tab (manifest JSON + poze `job_id__foto.jpg`)
- Buget API în health (`SURVEY_COST_BUDGET_USD=15`) + alertă în `/survey`
- Calculator solar → `/survey?from=calculator` (prefill consum, kWp, județ)
- Admin CRM: analytics engine (cost per provider, total rapoarte)
- Telegram opțional la CRM survey (`TELEGRAM_BOT_TOKEN`)
- `npm run survey:deploy` — docker compose + smoke

**Regulă Faza 6:** Batch + budget + notificări = pytest + Vitest route + doc `global.md`.

---

## Update 2026-07-06 — Faza 7–10 (Field Intelligence + SaaS v1.2)

**Livrat:**

| Faza | Feature |
|---|---|
| 7 | Kimi client + routing 10+ poze (`kimi.py`, `pipeline.py`) |
| 8 | EXIF/GPS (`photo_metadata.py`), jurisdicții RO (`jurisdictions.py`), AHJ enriched |
| 9 | Webhook CRM (`surveyWebhook.ts`), E2E batch+calculator, `survey:post-deploy` |
| 10 | `INSTALLER_API_KEYS`, rate limit 60/h, `GET /stats`, UI cheie API + dropdown județ + GPS |

**Bridge Node completat:** `/api/survey/jurisdictions`, `/api/survey/stats`, forward `X-Installer-Key` pe generate/batch.

**Teste:** pytest 62+ · Vitest +2 routes (jurisdictions, stats) · E2E +2 (batch tab, calculator prefill)

**Env noi în `.env.production.example`:** `KIMI_*`, `INSTALLER_API_KEYS`, `SURVEY_WEBHOOK_*`, `SURVEY_RATE_LIMIT_PER_HOUR`

---

## Update 2026-07-06 — Retrospective Loop + local dev hardening

**Regulă nouă (Loop 6):** După **fiecare task** → retrospectivă obligatorie în `grok.md` (greșeală → cauză → fix permanent → comandă verify). Skill actualizat: 6 loop-uri, nu 5.

### Retrospective — sesiune deploy + Windows local

| Greșeală | Cauză | Fix permanent | Verify |
|---|---|---|---|
| Push pe GitHub greșit | Remote confuz `solaris-cet` vs `solaris-clean` | Doc + `gitea:push` → **Gitea `Solaris-Cet/solaris-clean`** | `git remote -v` |
| Prod `/api/survey/health` 404 | Coolify fără redeploy / serviciu survey | Așteptăm Hetzner unblock → redeploy + `survey:post-deploy` | `npm run survey:post-deploy` |
| `app:dev` 500 PostCSS | Lipsește oxide Windows | `optionalDependencies` `@tailwindcss/oxide-win32-x64-msvc` | `curl localhost:5173` → 200 |
| `app:dev` eșuează pe cmd | Script `../node_modules/.bin/vite` | `"dev": "vite"`, `"api:build": "tsc"` | `npm run app:dev` |
| Survey UI fără API în dev | Vite nu proxy-uia `/api` | `vite.config.ts` proxy `/api` → `:3000` | `5173/api/survey/health` → JSON |
| 3 terminale, porturi zombie | Procese vechi pe 8000/3000/5173 | **`npm run dev:local`** + check porturi + Ctrl+C oprește tot | `npm run dev:local` |
| Gmail MCP blocat | OAuth keys lipsă (user step) | Pași documentați; nu pretinde că email merge fără `gcp-oauth.keys.json` | `grok mcp doctor gmail` |
| Hetzner auto-reply | Lock `L002DD869` = neplată | Așteptăm răspuns uman; homepage prod 200 parțial | Robot invoices Paid |

**Comenzi zilnice (actualizat):**
```bash
npm run dev:local          # tot stack-ul local (recomandat)
npm run dev:local -- --skip-build   # repornire rapidă
npm run survey:smoke
npm run survey:post-deploy # după redeploy VPS
```

**Feedback Loop → Retrospective:** utilizatorul a cerut explicit învățare continuă din greșeli — Loop 6 devine obligatoriu la finalul fiecărui task, nu opțional.

---

## Update 2026-07-06 — Stash memory + loops v2

**Sursă:** [fergana-labs/stash](https://github.com/fergana-labs/stash) — shared memory for coding agents (search sessions, fail loud, self-sufficient, checkpoint).

**Livrat:**
| Artefact | Rol |
|---|---|
| `docs/planning/agent-memory.md` | Memorie locală — bine/rău agenți anteriori (până la `stash connect`) |
| `.cursor/rules/solaris-agent-memory.mdc` | Reguli Cursor — Memory Loop + dev:local + retrospective |
| `solaris-perfect-loops` skill | **8 loop-uri (0–7)** — Memory + Verify self-sufficient |
| `stashai` pip install | CLI pe Windows (necesită `stash signin` + `stash connect` — user) |

**Loop-uri v2 (ordine):**
0. **Memory** — `agent-memory.md` + `grok.md` + `stash search`
1. Research
2. Build (+ checkpoint DONE/VERIFIED/LEFT)
3. **Verify** — rulezi tu smoke/curl, nu userul
4. Optimization
5. Agent routing
6. Feedback
7. Retrospective → update `agent-memory.md` dacă anti-pattern nou

**Stash setup (o dată):**
```powershell
pip install stashai
stash signin
cd "C:\Users\CCons\Desktop\SOLARIS CET"
stash connect
```

**Ce am învățat din Stash vs agenții noștri:**
- ✅ Bun: livrare end-to-end survey, docs în grok.md
- ❌ Rău: amnesie între sesiuni (push greșit, API fără proxy) → Memory Loop 0
- ❌ Rău: „rulează tu” → Verify Loop self-sufficient
- Stash claim: +49% viteză cu memorie persistentă — target pentru echipă după `stash connect`

---

## Update 2026-07-06 — Stash verificat + loops finale

**Stash:** `balabanc053` autentificat · repo conectat (`.stash`, `CLAUDE.md`)

| Document în Stash | Link |
|---|---|
| agent-memory | https://app.joinstash.ai/p/8f084fff-c19e-4b8d-83b7-6a7e783ee63c |
| grok PM notes | https://app.joinstash.ai/p/517aca79-0fd7-4ae6-a047-1734fb7ce61c |
| perfect-loops SKILL | https://app.joinstash.ai/p/119ed9c3-ab71-43fa-a942-967559793bff |

**Comenzi loops (canonice):**
```bash
npm run stash:prime -- <topic>   # Loop 0 — ÎNAINTE de orice task
npm run dev:local                # Loop 3 — verify local
npm run survey:smoke             # Loop 3 — verify survey
npm run stash:sync               # Loop 7 — DUPĂ retrospective
```

**Verify 2026-07-06:** `stash:prime` OK · search hit pe 8 topicuri · local API 200

---

## Update 2026-07-06 — Loops v3 (Ralph × GitHub best practices × Fable 5)

**Sursă research:** Stash, superpowers (247k★), spec-kit (118k★), BMAD (50k★), ralphy (2.9k★), smart-ralph, claude-code hooks, mini-swe-agent, Aider, LangGraph, OpenHands, Henry Dowling agent velocity.

**Livrat:**
| Artefact | Rol |
|---|---|
| `docs/planning/SOLARIS-LOOPS-MASTER.md` | Master loops — 12 surse OSS + 12 domain loops D1–D12 |
| `solaris-perfect-loops` SKILL v3 | Ralph outer + inner 0–7 + Fable gate |
| `docs/planning/features/_template/` | research / design / tasks pentru epics |
| `npm run loops:next` | Ralph task picker |
| `.claude/commands/loops.md` | Slash command `/loops` |
| `.claude/settings.json` hooks | PostToolUse verify + Stop checkpoint |

**Domain loops (toate ideile proiectului):** D1 șantier · D2 vision · D3 PDF/Fable · D4 CRM · D5 SEO · D6 deploy · D7 PWA · D8 batch SaaS · D9 security · D10 enterprise 3D · D11 conversion · D12 multi-agent.

**Regulă Fable 5:** text premium ≤20% rapoarte; DeepSeek/Kimi extrag; Sonnet 5 rutină; Fable doar top-tier + research ambiguu.

---

## Update 2026-07-06 — Stash verify final + sync fix

**Problema:** `stash:sync` eșua cu 409 — `--name` nu schimbă numele paginii la upload fișier unic (folosește stem-ul fișierului).

**Fix permanent:** `stash-sync.mjs` folosește `stash files edit-page <id>` pentru paginile canonice:
| Fișier | Page ID |
|---|---|
| agent-memory.md | `8f084fff-c19e-4b8d-83b7-6a7e783ee63c` |
| grok.md | `517aca79-0fd7-4ae6-a047-1734fb7ce61c` |
| SKILL.md | `119ed9c3-ab71-43fa-a942-967559793bff` |

**Comandă nouă:** `npm run stash:verify` — fișiere locale + auth + search + `stash:prime` + `survey:smoke` + local/prod API.

**Verify 2026-07-06 (sesiune curentă):**

| Check | Rezultat |
|---|---|
| `stash:prime` | ✓ auth + 5 search queries cu hits |
| `survey:smoke` | ✓ health, dashboard, demo, jurisdictions |
| Local `5173/api/survey/health` | ✓ 200 (dev:local activ) |
| Prod `solaris-cet.com/api/survey/health` | ⚠ 404 — BLOCKED Hetzner `L002DD869` + Coolify redeploy |

**Loops canonice (finale):**
```bash
npm run stash:prime -- <topic>   # 0 Memory — ÎNAINTE
npm run dev:local                # 3 Verify local
npm run survey:smoke             # 3 Verify survey
npm run stash:sync               # 7 Retro — DUPĂ
npm run stash:verify             # audit complet (opțional)
SITE_URL=https://solaris-cet.com npm run survey:post-deploy  # după VPS
```

---

## Update 2026-07-06 — Epic soft-cost-platform T2–T6 (30 task-uri batch)

**Livrat (regula de 3: Memory → Build+Verify → Retro):**

| # | Task | DONE | VERIFIED |
|---|---|---|---|
| T2 | Context API unificat (report + jurisdiction + CRM + cost) | `context_api.py` + Node proxy | pytest + Vitest |
| T3 | Explainable findings (`confidence`, `evidence_photo_ids`) | `explainable.py` + PDF secțiune 04 | pytest golden |
| T4 | Permit export ZIP județ RO | `build_permit_zip` + buton SurveyPage | pytest zip |
| T5 | Technician correction hook | `corrections.jsonl` + UI corecție | pytest + Vitest |
| T6 | Retro BCG S1–S6 | `global.md` + `tasks.md` | stash:sync |

**Feedback loop (L-FS-6 factor 3):** tehnicianul poate trimite corecții post-raport → `output/corrections.jsonl` → input pentru loop săptămânal prompt patch.

**API noi stabilite:**
- `GET /api/survey/context?report_id=`
- `GET /api/survey/permit-pack?report_id=`
- `POST /api/survey/corrections`

**LEFT:** prod deploy după deblocare Hetzner + Coolify redeploy `main`.

---

## Update 2026-07-06 — S5 Agentic Orchestration DONE

**OODA agent șantier:**
- `survey_agent.py` — `assess_permit_risk` + `build_orchestration_plan`
- Generate returnează `orchestration` block
- SurveyPage: pași vizibili + auto-CRM când `auto_crm` și budget OK
- Webhook: `survey_orchestration_complete`

**API:** `GET /api/survey/orchestrate?report_id=`

---

## Update 2026-07-06 — S6 API-First + Twin Feed (30 task-uri batch)

**Livrat:**
- `surveyOpenApi.ts` — contract stabil 14 rute `/api/survey/*`
- `GET /api/openapi/survey` + merge OpenAPI v2
- `twin_feed.py` — schema `solaris-twin-feed-v1` (D10 prep)
- Admin: `survey-insights` + badge încredere scăzută în LeadsSection
- `server/index.cjs` — rute lipsă înregistrate (fix prod 404)
- SDK: `createSolarisClient().survey.health|context|twinFeed|openApiSpec`
- Batch: `orchestration_summary` în răspuns `/batch`

**VERIFY:** pytest 7/7 · Vitest 21/21 · smoke core OK (S6 extended după restart engine)

---

## Update 2026-07-06 — D10 Twin UI + Installer SaaS (installer-twin-deploy, 30 task-uri)

**Livrat:**
- `installer_registry.py` — agregat per instalator + `by_installer_detail` în registry stats
- `GET /installer/me` + `GET /installers` engine · bridge Node + admin `InstallersSection`
- `TwinFeedPanel` în SurveyPage după generare · link Twin în LeadsSection
- `post-deploy-survey.mjs` extins (openapi, context, twin) · `npm run survey:bridge-smoke`
- Fix AdminPanel: `newLeadsCount` în `buildNav()` (nu la nivel de modul)
- OpenAPI path `/api/survey/installer/me` · SDK `installerMe(installerKey?)`

**VERIFY:** pytest `test_installer_registry` · Vitest installerApi + route · Playwright twin panel

---

## Update 2026-07-06 — D10 Twin Runtime (d10-twin-runtime, 30 task-uri)

**Livrat:**
- `twin_runtime.py` — JSONL events + SSE snapshot stream (peste `solaris-twin-feed-v1`, contract neschimbat)
- Hooks generate/demo/correction → `publish_twin_event`
- Node bridge: `/api/survey/twin-events`, `/api/survey/twin-stream`
- `TwinRuntimePanel` + `useTwinStream` (fetch SSE) + `TwinMapViewer` OSM embed
- Admin `TwinMonitorSection` · webhook `twin_feed_updated`
- Smoke S7: twin-events + twin-stream snapshot

**VERIFY:** pytest `test_twin_runtime` · Vitest twinRuntimeApi · Playwright twin runtime panel

---

## Update 2026-07-06 — Prod Deploy Gate (prod-deploy-gate, 30 task-uri)

**Livrat:**
- `survey-prod-gate.mjs` — gate complet prod (critice + OpenAPI paths + extended demo flow)
- `surveyRouteManifest.mjs` — manifest sincron cu OpenAPI
- `gitea-push-retry.mjs` · `coolify-redeploy-survey.mjs` · `deploy-status.mjs`
- `post-deploy.mjs` integrează survey gate · `smoke-http` probe `/api/survey/health`
- `npm run survey:prod-gate` · `deploy:status` · `gitea:push-retry`

**VERIFY:** manifest self-test · Vitest surveyProdGate · SOFT_FAIL=1 pe prod până Coolify redeploy

---

## Update 2026-07-06 — Twin CRM Webhooks (twin-crm-webhooks, 30 task-uri)

**Livrat:**
- `twin_webhook.py` — outbound `TWIN_WEBHOOK_URL` + delivery log JSONL + inbound `crm_sync`
- SSE persistent `iter_sse_persistent_stream()` + heartbeat · `useTwinStream` reconnect
- `Twin3DViewer.tsx` (@react-three/fiber) · toggle 3D/Hartă în `TwinRuntimePanel`
- Node bridge: `POST /api/survey/twin-webhook` · `GET /api/survey/twin-webhook/deliveries`
- Admin `TwinWebhookSection` · OpenAPI + SDK `twinWebhookDeliveries` / `postTwinWebhook`
- Smoke S8: persistent stream + webhook deliveries/status

**VERIFY:** pytest `test_twin_webhook` · Vitest useTwinStream + twin3dScene · Playwright 3D toggle

---

## Update 2026-07-06 — Twin AI Agent (twin-ai-agent, 30 task-uri)

**Livrat:**
- `twin_agent.py` — fuzionează twin feed + orchestration S5 în plan acțiuni
- Evenimente `agent_plan_ready` / `agent_action` / `agent_reassess` în twin runtime
- Bridge: `/api/survey/twin-agent`, `/execute`, `/decisions`
- `TwinAgentPanel` + `useTwinAgent` · Admin `TwinAgentSection`
- Webhook `agent_action` pe execute · smoke S9

**VERIFY:** pytest `test_twin_agent` · Vitest twinAgent · Playwright twin agent panel

---

## Update 2026-07-06 — Survey Offline PWA (survey-offline-pwa, 30 task-uri)

**Livrat:**
- `useSurveyOfflineSync` — draft autosave + coadă + sync la reconectare
- `SurveyOfflinePanel` — badge offline + sync UI
- `surveyOfflineManifest` + `GET /api/survey/offline-manifest`
- Engine `offline-hints` · SW cache `/survey` + `PROBE_SURVEY_SHELL`
- Admin `SurveyOfflineSection` · smoke S10

**VERIFY:** pytest `test_survey_offline` · Vitest manifest/queue · Playwright offline queue label

---

## Update 2026-07-06 — Go-To-Market Strategy (go-to-market, Rule of 3×3)

**Livrat:**
- `GO-TO-MARKET-STRATEGY.md` v3.3 — 3 passes × 3 loop improvements
- Dual engine: B2C Solaris Go + B2B Survey SaaS soft-cost compression
- Pricing, partners, 90/180/365 roadmap, KPI dashboard, risk matrix
- Loops tooling: `loops:status`, `loops:refine` (DeepSeek), `aider` wrapper
- Windows: `run-e2e-batched.mjs` fileURLToPath · `gitea-push-retry` git spawn fix
- `@rollup/rollup-win32-x64-msvc` optionalDependency

**VERIFY:** `npm run loops:status` (10 epics, 0 open) · GTM §0–13

**LEFT:** prod deploy demo B2B public  
**BLOCKED:** Hetzner `L002DD869` + Coolify redeploy `main`

---

## Update 2026-07-06 — HANDOFF.md (loops recovery protocol)

**Livrat:** `docs/planning/HANDOFF.md` — handoff complet pentru agenți când prima soluție eșuează.

**Conține:** gol final · stadiu curent · files in flight · timeline sesiuni/agents · failed attempts catalog · next steps · recovery loop R0–R7.

**Next agent Loop 0:** `npm run stash:prime -- handoff` → citește `HANDOFF.md` §1 + §5.

---

## Update 2026-07-06 — P0 deploy executat (parțial)

**Rulat:** `npm run deploy:p0` · `survey:prod-gate` SOFT_FAIL=1 · `gitea:push-retry --github` · `stash:sync`

| Step | Rezultat |
|---|---|
| GitHub `main` | ✓ up-to-date |
| Gitea `origin` | ✗ 504 |
| Coolify redeploy | ✗ `COOLIFY_*` lipsă în env local |
| Prod `/` | 200 |
| Prod `health.json` + `/api/survey/*` | 404 HTML |
| prod-gate | 5 hard + 6 soft fail |

**Livrat cod:** `deploy:p0` · `coolify-deploy.mjs` (Windows, fără bash) · `coolify-redeploy-survey` refactor

**USER action:** setează `COOLIFY_BASE_URL`, `COOLIFY_API_TOKEN`, `COOLIFY_RESOURCE_UUID` → `npm run deploy:p0`

---

## Update 2026-07-06 — Improvement Registry 10_000 (Rule of 3)

**Livrat:**
- `npm run improve:audit` → **10_000** items în `docs/planning/improvements/registry.jsonl`
- `improve:status` · `improve:next` · `improve:mark` · `improve:mark-batch`
- **Pass 2:** Windows `app/package.json` → `run-bin.mjs` (31 script fixes)
- **Pass 2:** `survey/generate` route tests (16/16 Vitest)
- **Pass 3:** `WINDOWS_DEV.md`, `API-COVERAGE.md`, epic `tsc-cleanup`
- **Done:** 78+ items marked in registry

**Rule of 3:** Discover (audit) → Prioritize (P0–P3) → Verify (mark done + tests)
