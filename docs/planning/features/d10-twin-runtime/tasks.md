# Tasks — d10-twin-runtime

> Epic D10 Twin runtime — SSE stream + event log peste `solaris-twin-feed-v1` (30 task-uri).

**Feature:** Live twin events, SSE snapshot stream, admin monitor  
**Domain:** D10 Twin + D1 Field + D4 Admin  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `twin_runtime.py` — event log JSONL
- [x] T03 `publish_twin_event()` + event types
- [x] T04 `GET /twin-events` engine
- [x] T05 `GET /twin-stream/{report_id}` SSE engine
- [x] T06 Hook generate/demo/correction → publish event
- [x] T07 `GET /twin-runtime/status` engine
- [x] T08 Node `/api/survey/twin-events`
- [x] T09 Node `/api/survey/twin-stream` SSE proxy
- [x] T10 `server/index.cjs` twin runtime routes
- [x] T11 `twinRuntime.ts` types
- [x] T12 `useTwinStream.ts` hook
- [x] T13 `twinRuntimeApi.ts` client
- [x] T14 `TwinMapViewer.tsx` OSM embed
- [x] T15 `TwinRuntimePanel.tsx` live panel
- [x] T16 SurveyPage — TwinRuntimePanel după generare
- [x] T17 Admin `TwinMonitorSection.tsx`
- [x] T18 AdminPanel nav twin-monitor
- [x] T19 OpenAPI twin-events + twin-stream
- [x] T20 `publicApiSdk.survey.twinEvents()`
- [x] T21 Webhook `twin_feed_updated` pe corrections POST
- [x] T22 pytest `test_twin_runtime.py`
- [x] T23 Vitest twinRuntime + route tests
- [x] T24 Integration test twin-events
- [x] T25 Playwright twin runtime smoke
- [x] T26 `survey-smoke.mjs` S7 twin-events
- [x] T27 `survey-bridge-smoke.mjs` twin-stream
- [x] T28 `global.md` + `grok.md` + CONSULTING invent
- [x] T29 `stash:sync`
- [x] T30 GitHub push