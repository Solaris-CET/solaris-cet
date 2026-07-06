# Tasks — twin-crm-webhooks

> Epic 7 — viewer 3D WebGL + SSE persistent + CRM twin webhooks bidirecțional (30 task-uri).

**Feature:** Twin3D, persistent SSE, outbound/inbound CRM webhooks  
**Domain:** D10 Twin + D4 Admin + CRM  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `twin_webhook.py` — outbound dispatch + delivery log
- [x] T03 `handle_inbound_webhook()` + `crm_sync` event type
- [x] T04 `GET /twin-webhook/deliveries` engine
- [x] T05 `POST /twin-webhook/inbound` engine
- [x] T06 `iter_sse_persistent_stream()` + heartbeat în `twin_runtime.py`
- [x] T07 `GET /twin-stream/{id}?persistent=1` engine param
- [x] T08 Hook `publish_twin_event` → outbound webhook
- [x] T09 `app/api/lib/twinWebhook.ts` Node outbound + log
- [x] T10 `POST /api/survey/twin-webhook` inbound bridge
- [x] T11 `GET /api/survey/twin-webhook/deliveries` bridge
- [x] T12 `server/index.cjs` twin-webhook routes
- [x] T13 `useTwinStream.ts` — persistent reconnect + heartbeat
- [x] T14 `twin3dScene.ts` — panel layout din kWp
- [x] T15 `Twin3DViewer.tsx` WebGL site model
- [x] T16 `TwinRuntimePanel` — toggle Hartă / 3D
- [x] T17 Admin `TwinWebhookSection.tsx` delivery log
- [x] T18 AdminPanel nav `twin-webhooks`
- [x] T19 OpenAPI twin-webhook + persistent stream param
- [x] T20 SDK `twinWebhookDeliveries()` + `postTwinWebhook()`
- [x] T21 Node generate/corrections → `dispatchTwinWebhook`
- [x] T22 pytest `test_twin_webhook.py`
- [x] T23 Vitest twinWebhook + useTwinStream persistent
- [x] T24 Integration test twin-webhook route
- [x] T25 Playwright Twin3D toggle smoke
- [x] T26 `survey-smoke.mjs` S8 persistent SSE + webhooks
- [x] T27 `survey-bridge-smoke.mjs` twin-webhook paths
- [x] T28 `surveyRouteManifest.mjs` twin-webhook probe
- [x] T29 `global.md` + `grok.md` + CONSULTING invent
- [x] T30 `stash:sync` + GitHub push