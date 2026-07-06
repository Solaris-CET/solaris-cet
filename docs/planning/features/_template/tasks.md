# Tasks — <FEATURE_SLUG>

> Copiază acest folder în `docs/planning/features/<slug>/` pentru epics multi-sesiune.
> Ralph Outer Loop: rulează `npm run loops:next` până toate sunt `[x]`.

**Feature:** _descriere scurtă_  
**Domain:** D_?_  
**Status:** in_progress

---

## Tasks

- [ ] **T1 — Research & design lock**
  - **Files:** `design.md`, `research.md`
  - **MODEL:** Grok (plan)
  - **VERIFY:** design conține files + env + model routing
  - **DONE when:** user sau Grok confirmă scope

- [ ] **T2 — Implementare core**
  - **Files:** _listează căi exacte_
  - **MODEL:** DeepSeek (code) · Grok (review)
  - **VERIFY:** `npm run verify:fast`
  - **DONE when:** teste noi verzi

- [ ] **T3 — Survey bridge (dacă atinge API)**
  - **Files:** `app/vite.config.ts`, `app/api/...`, `survey-engine/...`
  - **VERIFY:** `npm run dev:local` + `curl localhost:5173/api/survey/health`
  - **DONE when:** JSON nu HTML

- [ ] **T4 — Documentare + retro**
  - **Files:** `docs/planning/global.md`, `grok.md`
  - **VERIFY:** `npm run stash:sync`
  - **DONE when:** retrospective scrisă

---

## Progress log (`.progress.md` mirror)

| Date | Task | DONE | VERIFIED | BLOCKED |
|---|---|---|---|---|
| | | | | |