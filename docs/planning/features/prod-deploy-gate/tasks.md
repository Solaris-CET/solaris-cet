# Tasks — prod-deploy-gate

> Epic D6 — Coolify redeploy gate + prod smoke extins (30 task-uri).

**Feature:** Survey prod gate, Gitea retry, Coolify redeploy hook, deploy status  
**Domain:** D6 Deploy + D1 Survey bridge  
**Status:** done

---

## Tasks (30)

- [x] T01 Epic scaffold
- [x] T02 `surveyRouteManifest.mjs` — rute gate canonice
- [x] T03 `survey-prod-gate.mjs` — gate master
- [x] T04 `OPENAPI_REQUIRED_PATHS` cross-check
- [x] T05 Extended flow (demo → context → twin)
- [x] T06 `SOFT_FAIL` mode pentru prod parțial
- [x] T07 `post-deploy-survey.mjs` → gate alias
- [x] T08 `post-deploy.mjs` integrează survey gate
- [x] T09 `smoke-http.mjs` — `/api/survey/health`
- [x] T10 `deploy-survey-stack.mjs` — bridge smoke
- [x] T11 `stash-verify` — prod gate probe
- [x] T12 `gitea-push-retry.mjs`
- [x] T13 `coolify-redeploy-survey.mjs`
- [x] T14 `deploy-status.mjs`
- [x] T15 `survey-route-manifest.test.mjs`
- [x] T16 Vitest `surveyProdGate.test.ts`
- [x] T17 package.json scripts (prod-gate, deploy:status, etc.)
- [x] T18 `.env.production.example` COOLIFY + POST_DEPLOY
- [x] T19 `RUNBOOK.md` survey deploy gate
- [x] T20 `SURVEY_ENGINE_INTEGRATION.md` update
- [x] T21 `global.md` epic note
- [x] T22 `grok.md` retro
- [x] T23 `CONSULTING-SOLUTIONS` deploy note
- [x] T24 `stash:prime` hint prod-gate
- [x] T25 `--json` output pe prod-gate
- [x] T26 Gate timeout env `GATE_TIMEOUT_MS`
- [x] T27 `gitea:push-retry --github` fallback
- [x] T28 Manifest vs `index.cjs` self-test
- [x] T29 `stash:sync`
- [x] T30 GitHub push