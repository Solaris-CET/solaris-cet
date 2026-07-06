# Tasks — soft-cost-platform

> Epic din CONSULTING-SOLUTIONS.md — compresie soft costs pentru instalatori PV (BCG Field Service + DOE/NREL).

**Feature:** Platformă soft-cost — ROI vizibil, permit-ready, date unificate  
**Domain:** D1 Field + D3 PDF + D4 CRM  
**BCG phase:** Reshape  
**Status:** done

---

## Tasks

- [x] **T1 — Soft Cost ROI dashboard (admin)**
  - **Files:** `app/src/.../LeadsSection.tsx`, `survey-engine` stats
  - **MODEL:** DeepSeek (code) · Grok (review)
  - **VERIFY:** Vitest + manual: minutes_saved × rate displayed
  - **DONE when:** admin vede €/raport și min salvate per `installer_id`
  - **Loop:** L-SOFT-ROI

- [x] **T2 — Unified context API `GET /context/{report_id}`**
  - **Files:** `survey-engine/src/server.py`, `app/api/...`, Vitest route
  - **MODEL:** DeepSeek
  - **VERIFY:** `npm run survey:smoke` + pytest
  - **DONE when:** JSON include report + jurisdiction + CRM link + cost
  - **Loop:** L-FS-6 factor 1 (data layer)

- [x] **T3 — Explainable findings în pipeline**
  - **Files:** `pipeline.py`, `models.py`, PDF template
  - **MODEL:** DeepSeek/Kimi extract · Sonnet 5 routine · Fable 5 premium only
  - **VERIFY:** pytest golden JSON `confidence` + `evidence_photo_ids`
  - **DONE when:** PDF are secțiune „Basis of opinion”
  - **Loop:** L-SUP-GATE + L-FS-6 factor 4

- [x] **T4 — Permit export pack (județ RO)**
  - **Files:** `ahj_export.py`, `jurisdictions.py`
  - **VERIFY:** sample export pentru 1 județ + GPS
  - **DONE when:** instalator poate descărca ZIP permit-ready
  - **Loop:** Deploy phase checklist

- [x] **T5 — Technician correction hook (adaptive)**
  - **Files:** `SurveyPage.tsx`, `survey-engine` corrections log
  - **VERIFY:** Vitest event + fișier `corrections.jsonl` creat
  - **DONE when:** feedback loop documentat în `grok.md`
  - **Loop:** L-FS-6 factor 3

- [x] **T6 — Documentare + retro consulting**
  - **Files:** `CONSULTING-SOLUTIONS.md`, `global.md`, `grok.md`
  - **VERIFY:** `npm run stash:sync`
  - **DONE when:** retrospective BCG mapping completă

---

## Progress log

| Date | Task | DONE | VERIFIED | BLOCKED |
|---|---|---|---|---|
| 2026-07-06 | Epic creat din research BCG/DOE | research | — | — |
| 2026-07-06 | T1 ROI dashboard admin | LeadsSection + soft_cost_roi.py | pytest + Vitest | — |
| 2026-07-06 | T2 context API | context_api.py + /api/survey/context | pytest + Vitest | — |
| 2026-07-06 | T3 explainable + PDF Basis | explainable.py + report_generator | pytest golden | — |
| 2026-07-06 | T4 permit ZIP | ahj_export.build_permit_zip | pytest zip | — |
| 2026-07-06 | T5 corrections hook | corrections.py + SurveyPage | pytest + Vitest | — |
| 2026-07-06 | T6 retro BCG | global.md + grok.md | stash:sync | — |