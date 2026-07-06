# Tasks — survey-offline-pwa

> Epic 9 — PWA offline complet pentru tehnician survey: coadă IndexedDB + sync + precache (30 task-uri).

**Feature:** Offline queue, draft autosave, SW precache survey shell  
**Domain:** D1 Field + PWA  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `surveyOfflineManifest.ts` — URL-uri precache survey
- [x] T03 Extindere `surveyDraftStorage` — status coadă + retry
- [x] T04 `surveyOfflineQueue.ts` — stats + helpers
- [x] T05 `useSurveyOfflineSync.ts` — hook sync + autosave
- [x] T06 `surveyOfflinePrefetch.ts` — SW prefetch helper
- [x] T07 `sw.js` — cache `/survey` + `PROBE_SURVEY_SHELL`
- [x] T08 `survey_offline.py` — offline hints engine
- [x] T09 `GET /offline-hints` engine
- [x] T10 `GET /api/survey/offline-manifest` bridge
- [x] T11 `server/index.cjs` offline-manifest route
- [x] T12 `SurveyOfflinePanel.tsx` — badge + coadă UI
- [x] T13 SurveyPage refactor — hook + panel
- [x] T14 Admin `SurveyOfflineSection.tsx`
- [x] T15 AdminPanel nav `survey-offline`
- [x] T16 OpenAPI offline-manifest
- [x] T17 SDK `surveyOfflineManifest()`
- [x] T18 Vitest surveyOfflineQueue + manifest
- [x] T19 Vitest useSurveyOfflineSync
- [x] T20 Vitest offline-manifest route
- [x] T21 pytest `test_survey_offline.py`
- [x] T22 Playwright survey offline queue smoke
- [x] T23 `survey-smoke.mjs` S10 offline-hints
- [x] T24 `survey-bridge-smoke.mjs` offline-manifest
- [x] T25 `surveyRouteManifest.mjs` probe
- [x] T26 `pwa-offline.spec.ts` survey shell probe
- [x] T27 `global.md` + `grok.md` + CONSULTING invent
- [x] T28 `stash:sync`
- [x] T29 GitHub push
- [x] T30 Retro epic done