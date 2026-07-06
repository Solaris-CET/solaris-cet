# Tasks — installer-twin-deploy

> Epic D10 Twin UI + Installer SaaS + deploy gate (30 task-uri).

**Feature:** Twin feed UI, installer identity API, post-deploy gate extins  
**Domain:** D1 Field + D4 Admin + D10 Twin  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `installer_registry.py` — listă instalatori + stats
- [x] T03 `GET /installer/me` engine
- [x] T04 `GET /installers` public aggregate
- [x] T05 Node `/api/survey/installer/me`
- [x] T06 Node `/api/admin/installers`
- [x] T07 `installerApi.ts` client helpers
- [x] T08 `twinFeedMap.ts` — link hartă GPS
- [x] T09 `TwinFeedPanel.tsx` component
- [x] T10 SurveyPage — panel twin după generare
- [x] T11 Admin `InstallersSection.tsx`
- [x] T12 AdminPanel nav + routing installers
- [x] T13 `post-deploy-survey.mjs` — context, openapi, twin
- [x] T14 `survey-bridge-smoke.mjs` — bridge Node local
- [x] T15 `stash-verify` — openapi/survey route
- [x] T16 OpenAPI `installer/me` path
- [x] T17 `publicApiSdk.installer.me()`
- [x] T18 `.env.example` INSTALLER_API_KEYS
- [x] T19 pytest `test_installer_registry.py`
- [x] T20 Vitest `installerApi.test.ts`
- [x] T21 Integration test installer/me route
- [x] T22 Playwright twin panel smoke
- [x] T23 LeadsSection link twin-feed
- [x] T24 `server/index.cjs` installer routes
- [x] T25 Batch stats per installer în registry
- [x] T26 Survey health expune `installer_keys_required`
- [x] T27 `global.md` + `grok.md`
- [x] T28 `CONSULTING-SOLUTIONS` invent phase note
- [x] T29 `stash:sync`
- [x] T30 Gitea push