# 10 Random Hard Tasks — Generated in Grok 4.5 Mode

**Date:** 2026-07-09  
**Mode:** High-signal, frontier-level task generation (Grok 4.5 style)  
**Status:** AUTOPROMPT v4.5 runner is operational (see AUTOPROMPT.md). Use it to drive these tasks.  
**Philosophy:** Ambitious but grounded. Every task is cross-cutting, has clear verify gates, requires AEP, and delivers measurable impact. Randomly sampled across the real architecture (survey-engine, twin runtime, CRM, PWA, deploy, AI routing).

Use these with the loops system:
- `npm run stash:prime -- "<task title>"`
- `npm run graphify:prime -- "<task title>"`
- Create `docs/planning/features/<slug>/` with `design.md` + `tasks.md`
- End every task with the standard checkpoint.

---

## HARD-001: Twin Runtime Event Replay & Durable Log — DONE (2026-07-09)

**DONE:** `replay_twin_events()` · `GET /twin-replay` · `GET /api/survey/twin-replay` · idempotent webhooks by `event_id` · frontend catch-up + dedupe in `useTwinStream`  
**VERIFIED:** `pytest tests/test_twin_runtime.py tests/test_twin_webhook.py` 10 passed · vitest twin replay/useTwinStream 8 passed

**Domain:** survey-engine + frontend twin

**Why it's hard:** Current twin events are fire-and-forget SSE. Need durable append-only log, replay from arbitrary point, exactly-once semantics for CRM webhooks, and recovery after engine restarts or network partitions. Must handle out-of-order events and idempotency.

**Scope:**
- `survey-engine/src/twin_runtime.py`
- `survey-engine/src/twin_webhook.py`
- `app/api/survey/twin-*` routes
- `app/src/lib/useTwinStream.ts` + `TwinRuntimePanel`

**Acceptance Criteria:**
- Events are persisted to `twin_events.jsonl` (or proper store) with sequence numbers + timestamps.
- `GET /api/survey/twin-replay?from_seq=123` works.
- Webhook deliveries become idempotent (use event id).
- Frontend can request catch-up on reconnect and render without duplicates.
- Survives full `survey-engine` restart.

**VERIFY:**
```bash
npm run survey:smoke
npm run survey:bridge-smoke
cd app && npm run test -- src/__tests__/twin*.test.*
npm run verify
```

**Complexity:** High (distributed systems concepts in a monolith).

---

## HARD-002: Per-Installer AI Cost Attribution + Hard Budget Enforcement — DONE (2026-07-09)

**DONE:** `installer_budget.py` · `INSTALLER_BUDGETS` env · HTTP 402 hard stop · `cost_attribution.py` per-run tokens · `ReportRecord` attribution fields · installer profile `budget` + per-report cost breakdown  
**VERIFIED:** `pytest tests/test_installer_budget.py tests/test_cost_attribution.py` passed

**Domain:** AI routing + CRM + billing

**Why it's hard:** We already have basic budget. Need full attribution (vision tokens + text tokens + model per call) written to every `ReportRecord`, exposed in installer dashboard, with hard enforcement (reject generation when over budget) + soft alerts + monthly rollover.

**Scope:**
- `survey-engine/src/*` (pipeline, clients, context_api)
- `app/api/survey/*` + installer routes
- Admin `InstallersSection` + new cost analytics
- `survey-engine/src/cost_tracker.py` (new or expand)

**Acceptance Criteria:**
- Every generated report records exact `cost_usd`, `model_used`, `input_tokens`, `output_tokens`, `vision_calls`.
- Installer key has `monthly_budget_usd`.
- Hard stop when budget exceeded (clear error to UI + API).
- Dashboard shows per-report breakdown + trend.
- Monthly reset + carry-over option.

**VERIFY:**
```bash
npm run survey:prod-gate
npm run survey:test
cd app && npm run test -- src/__tests__/*installer* src/__tests__/*cost*
npm run verify
```

---

## HARD-003: Advanced Offline Conflict Resolution for Survey Drafts — IN PROGRESS (2026-07-09)

**SHIPPED (foundation):** `surveyDraftConflict.ts` version vectors + lamport field clocks · auto-merge non-overlapping · `GET/POST /api/survey/draft-sync` · conflict UI in `SurveyOfflinePanel` · hook sync on online  
**VERIFIED (partial):** vitest `surveyDraftConflict` 4 passed · `surveyDraftSyncRoute` 2 passed · `useSurveyOfflineSync` 4 passed · pytest `test_survey_offline` 2 passed  
**LEFT:** 3-way merge UI polish · persistent server store (not in-memory) · multi-device E2E · IndexedDB v2 migration

**Domain:** PWA + survey UI + backend

**Why it's hard:** Current offline is basic queue + last-write-wins. Need proper CRDT-lite or merge strategy for checklist changes + photo metadata when technician and office edit the same draft.

**Scope:**
- `app/src/hooks/useSurveyOfflineSync.ts`
- IndexedDB schema
- `survey-engine/src/offline.py` or Node bridge
- Conflict UI in SurveyPage

**Acceptance Criteria:**
- Detect conflicts on sync.
- Present 3-way merge UI (or smart auto-merge for non-overlapping fields).
- Photos are never lost.
- Version vector or lamport timestamps.
- Works across multiple devices for same installer.

**VERIFY:**
```bash
npm run survey:smoke
cd app && npm run test:e2e:stable -- tests/survey.spec.ts
npm run verify
```

**Complexity:** Very high (offline-first correctness is brutal).

---

## HARD-004: Dynamic Multi-Model Router with Quality Scoring + Automatic Fallback — DONE (2026-07-09)

**DONE:** `router.py` telemetry · correction-rate quality scoring · `vision_fallback_chain` · `GET /router/stats` · `GET /api/survey/router/stats` · pipeline wired via `route_survey_job`  
**VERIFIED:** `pytest tests/test_router.py` passed · vitest `routerStatsRoute` + `surveyRouteRegistry`

**Domain:** survey-engine AI layer

**Why it's hard:** Currently static routing in global.md. Need runtime router that chooses model based on photo count, checklist complexity, previous model success rate, current cost, latency SLA, and a learned "quality score".

**Scope:**
- `survey-engine/src/router.py` (new)
- `survey-engine/src/pipeline.py`
- All API clients (`kimi.py`, `claude.py`, `deepseek.py`)
- Telemetry + feedback loop from corrections

**Acceptance Criteria:**
- Router decides per-request (or per-batch).
- Records decision + reason + outcome.
- Falls back gracefully (Kimi → DeepSeek → Sonnet).
- Exposes `/api/survey/router/stats`.
- Quality improves over time via correction feedback.

**VERIFY:**
```bash
cd survey-engine && python -m pytest tests/test_router* -q
npm run survey:smoke
npm run survey:prod-gate
```

---

## HARD-005: Full End-to-End Tracing for Survey Generation (AI + HTTP + DB)

**Domain:** Observability + pipeline

**Why it's hard:** Currently fragmented logs. Need proper distributed tracing (traceparent across Node ↔ Python ↔ external LLM APIs) with cost and latency per span, visible in Grafana/Tempo or simple UI.

**Scope:**
- `survey-engine/` + `app/server/`
- OpenTelemetry instrumentation (already partial)
- `docker/` observability stack
- New `SurveyTraceViewer` in admin

**Acceptance Criteria:**
- Every `/api/survey/generate` and `/batch` has a trace_id.
- Spans for: upload, vision, LLM calls (with token counts), PDF, CRM write, webhook.
- Can query traces by `report_id`.
- Cost and duration per span visible.

**VERIFY:**
```bash
npm run verify:fast
# manual: trigger generation and check trace in logs / Tempo
```

---

## HARD-006: Secure Installer API Key Lifecycle (Rotation, Scoping, Revocation, Audit)

**Domain:** Security + installer SaaS

**Why it's hard:** Keys are currently simple. Need proper key management: scoped permissions (read-only vs generate vs admin), automatic rotation, immediate revocation that invalidates in-flight requests, full audit log.

**Scope:**
- Installer auth layer (`app/api/survey/*` + engine)
- New key management UI + API
- `INSTALLER_API_KEYS` handling
- Rate limit + quota integration

**Acceptance Criteria:**
- Keys have scopes.
- Revocation is instant (no cache window > 30s).
- Rotation flow without downtime for active sessions.
- Full audit trail visible in admin.
- Old keys are hashed only.

**VERIFY:**
```bash
npm run survey:bridge-smoke
npm run verify
# security review via `npm run audit:prod`
```

---

## HARD-007: High-Performance Parallel Vision + LLM Pipeline with Smart Batching

**Domain:** survey-engine performance

**Why it's hard:** Current sequential processing. Photos can be processed in parallel, LLM calls can be batched intelligently, but correctness (ordering, evidence linking) must be preserved. Also need backpressure and memory control.

**Scope:**
- `survey-engine/src/pipeline.py`
- Vision client
- LLM clients
- Report assembly

**Acceptance Criteria:**
- Configurable concurrency (env var).
- Significant reduction in wall time for 8+ photo reports (measure it).
- No regression in report quality or evidence linking.
- Memory stays bounded.

**VERIFY:**
```bash
cd survey-engine && python -m src.cli demo --photos 12 --measure-time
npm run survey:test
```

---

## HARD-008: Versioned Report Templates + Multi-AHJ PDF Engine

**Domain:** PDF generation + AHJ

**Why it's hard:** Different counties have different requirements. Need a template system (YAML/JSON + Jinja or similar) versioned per jurisdiction, with tests for every major AHJ, and ability to regenerate old reports with old templates.

**Scope:**
- `survey-engine/src/ahj_export.py`
- New template system
- `jurisdictions.py`
- Admin UI to preview templates

**Acceptance Criteria:**
- Templates are versioned and stored with report.
- Can regenerate PDF with exact historical template.
- At least 3 real Romanian jurisdictions have tested templates.
- UI for selecting template version.

**VERIFY:**
```bash
npm run survey:prod-gate
cd survey-engine && python -m pytest tests/test_ahj* -q
```

---

## HARD-009: Graphify-Powered "Related Code" Suggestions in Dev Workflow — DONE (2026-07-09)

**DONE:** `scripts/graphify-suggest.mjs` · `npm run graphify:suggest` · AUTOPROMPT `--suggest` wired  
**VERIFIED:** `npm run graphify:suggest -- "twin stream"` → 8 files JSON output

**Domain:** Agent tooling + DX

**Why it's hard:** graphify already exists. Make it actionable: a CLI + VSCode/Cursor integration that, given a file or task, suggests the 5-8 most relevant files to touch (using the knowledge graph + community detection).

**Scope:**
- `scripts/graphify-*.mjs`
- New `graphify suggest` command
- Optional MCP server or simple JSON output for editors
- Integration in loops / stash

**Acceptance Criteria:**
- `npm run graphify:suggest -- "SurveyPage twin"` returns high-quality list.
- Used inside AEP (documented).
- Measurably reduces time to find relevant code.

**VERIFY:**
```bash
npm run graphify:build
node scripts/graphify-suggest.mjs "twin stream"
npm run verify:fast
```

---

## HARD-010: Resilient Multi-Region / Multi-Instance Survey Engine with Leader Election for Twin

**Domain:** Infra + twin runtime (very hard)

**Why it's hard:** Currently single instance assumption. Need to support multiple survey-engine replicas (for scale/reliability) while keeping twin event ordering and exactly-once webhook delivery.

**Scope:**
- Docker compose / Coolify config
- `twin_runtime.py` + locking (Redis or file + advisory locks)
- Webhook dedup + outbox pattern
- Health + leader election

**Acceptance Criteria:**
- Two engine instances can run.
- Twin events maintain global order.
- No duplicate webhooks on failover.
- Graceful handoff documented.

**VERIFY:**
```bash
docker compose -f docker/docker-compose.survey.yml up --scale survey-engine=2
npm run survey:prod-gate
# chaos test: kill leader
```

---

## How to use these 10 tasks

1. Pick one (randomly or by priority).
2. `npm run stash:prime -- "HARD-00X Title"`
3. Create feature folder under `docs/planning/features/hard-00x-.../`
4. Follow full AEP + loops.
5. When done, update this file with `DONE` + commit hash + verify output.

**Generated with Grok 4.5-level reasoning:** focus on real architectural debt, cross-layer concerns, and tasks that will meaningfully move the product forward rather than shallow refactors.

Next step: pick one and run `npm run loops:next` style planning or start with P0 context.
