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
