# Tasks — api-first-platform

> Epic S6 + D10 prep — OpenAPI bridge stabil, twin feed, admin insights.

**Feature:** API-First Survey Platform  
**Domain:** D6 API + D10 Twin prep + D4 Admin  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold + design lock
- [x] T02 `surveyOpenApi.ts` shared paths builder
- [x] T03 `GET /api/openapi/survey` dedicated spec
- [x] T04 Merge survey paths în OpenAPI v2
- [x] T05 Register routes lipsă în `server/index.cjs`
- [x] T06 `twin_feed.py` schema D10
- [x] T07 `GET /twin-feed/{report_id}` engine
- [x] T08 Node proxy `/api/survey/twin-feed`
- [x] T09 `GET /corrections` list engine
- [x] T10 Corrections route GET proxy
- [x] T11 `twinFeed.ts` + `surveyApi` helpers
- [x] T12 `publicApiSdk` survey section
- [x] T13 Admin `survey-insights` aggregate API
- [x] T14 LeadsSection context + low-confidence badge
- [x] T15 `batch_orchestration_summary` agent helper
- [x] T16 Batch response orchestration hints
- [x] T17 Engine `GET /openapi.json` minimal
- [x] T18 `survey-smoke.mjs` extended (context/orch/twin)
- [x] T19 pytest `test_twin_feed.py`
- [x] T20 pytest `test_corrections_list.py`
- [x] T21 Vitest `surveyOpenApi.test.ts`
- [x] T22 Vitest `twinFeed.test.ts`
- [x] T23 Vitest `publicApiSdk` survey methods
- [x] T24 Static guard — survey route registry count
- [x] T25 Integration tests twin-feed + insights
- [x] T26 Playwright OpenAPI survey spec smoke
- [x] T27 DocsPage link survey OpenAPI
- [x] T28 `CONSULTING-SOLUTIONS` S6 retro complet
- [x] T29 `global.md` + `grok.md` update
- [x] T30 `stash:sync` + Gitea push