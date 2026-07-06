# Tasks — agentic-orchestration

> Epic S5 din CONSULTING-SOLUTIONS.md — agent șantier OODA: diagnostic → permit? → CRM → ofertă.

**Feature:** Agentic Service Orchestration  
**Domain:** D1 Field + D4 CRM + D5 Contact  
**BCG phase:** Invent (partial)  
**Status:** done

---

## Tasks

- [x] **T1 — Survey agent core (permit risk + plan OODA)**
  - **Files:** `survey-engine/src/survey_agent.py`, `server.py`
  - **MODEL:** DeepSeek
  - **VERIFY:** pytest `test_survey_agent.py`
  - **DONE when:** `assess_permit_risk` + `build_orchestration_plan` returnează pași
  - **Loop:** L-OODA-ITE

- [x] **T2 — Bridge generate + orchestrate API**
  - **Files:** `app/api/survey/orchestrate/route.ts`, `generate/route.ts`, `surveyApi.ts`
  - **VERIFY:** Vitest route + smoke
  - **DONE when:** generate response include `orchestration` block
  - **Loop:** L-FS-6 factor 5

- [x] **T3 — SurveyPage auto-flow (CRM + permit hint)**
  - **Files:** `SurveyPage.tsx`, `surveyAgent.ts`
  - **VERIFY:** Vitest unit + Playwright smoke
  - **DONE when:** post-generare auto-CRM când plan zice `auto_crm`
  - **Loop:** L-AGILITY-70

- [x] **T4 — Webhook orchestration event**
  - **Files:** `generate/route.ts`, `surveyWebhook.ts`
  - **VERIFY:** Vitest integration mock webhook
  - **DONE when:** `survey_orchestration_complete` dispatchat

- [x] **T5 — E2E gate survey → CRM → contact**
  - **Files:** `app/tests/survey.spec.ts`
  - **VERIFY:** `npm run test:e2e` survey spec
  - **DONE when:** test orchestration steps visible după demo

- [x] **T6 — Documentare + retro**
  - **Files:** `CONSULTING-SOLUTIONS.md`, `global.md`, `grok.md`
  - **VERIFY:** `npm run stash:sync`
  - **DONE when:** S5 marcat DONE în retro

---

## Progress log

| Date | Task | DONE | VERIFIED | BLOCKED |
|---|---|---|---|---|
| 2026-07-06 | Epic creat S5 | design | — | — |
| 2026-07-06 | T1–T6 agentic orchestration | survey_agent.py + SurveyPage | pytest + Vitest + E2E | — |