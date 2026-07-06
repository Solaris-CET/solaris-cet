# Tasks — twin-ai-agent

> Epic 8 — agent AI peste twin runtime + OODA orchestration (30 task-uri).

**Feature:** Twin agent plan, actionable recommendations, decision log  
**Domain:** D10 Twin + S5 Agent + D4 Admin  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `twin_agent.py` — plan builder + action types
- [x] T03 `build_twin_agent_plan()` — feed + orchestration fusion
- [x] T04 `execute_agent_action()` + decision log
- [x] T05 Event types `agent_plan_ready` / `agent_action` / `agent_reassess`
- [x] T06 `GET /twin-agent/{report_id}` engine
- [x] T07 `POST /twin-agent/{report_id}/execute` engine
- [x] T08 `GET /twin-agent/decisions` engine
- [x] T09 Hook generate/demo/correction → agent plan + reassess
- [x] T10 `GET /api/survey/twin-agent` bridge
- [x] T11 `POST /api/survey/twin-agent/execute` bridge
- [x] T12 `server/index.cjs` twin-agent routes
- [x] T13 `twinAgent.ts` types + helpers
- [x] T14 `twinAgentApi.ts` client
- [x] T15 `useTwinAgent.ts` hook
- [x] T16 `TwinAgentPanel.tsx` recommendations UI
- [x] T17 SurveyPage — TwinAgentPanel după TwinRuntimePanel
- [x] T18 Admin `TwinAgentSection.tsx` decision log
- [x] T19 AdminPanel nav `twin-agent`
- [x] T20 OpenAPI twin-agent routes
- [x] T21 SDK `twinAgent()` + `executeTwinAgentAction()`
- [x] T22 Webhook `agent_action` pe execute (twin + survey)
- [x] T23 pytest `test_twin_agent.py`
- [x] T24 Vitest twinAgent + route tests
- [x] T25 Integration test twin-agent bridge
- [x] T26 Playwright twin agent panel smoke
- [x] T27 `survey-smoke.mjs` S9 twin-agent
- [x] T28 `survey-bridge-smoke.mjs` + manifest probe
- [x] T29 `global.md` + `grok.md` + CONSULTING invent
- [x] T30 `stash:sync` + GitHub push