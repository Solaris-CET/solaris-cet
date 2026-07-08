# Tasks — improvement-registry

**Feature:** 10_000 improvement items + Rule of 3 waves  
**Domain:** D9 + D12  
**Status:** in_progress

---

## Tasks (Rule of 3 × 3)

- [x] **T1 — Pass 1 Discover: audit 10k registry**
  - **Files:** `scripts/improvement-audit.mjs`, `docs/planning/improvements/registry.jsonl`
  - **VERIFY:** `npm run improve:audit` → 10000 items
  - **DONE when:** SUMMARY.md generated

- [x] **T2 — Pass 1 tooling: next/status/mark**
  - **Files:** `improvement-next.mjs`, `improvement-status.mjs`, `improvement-mark.mjs`
  - **VERIFY:** `npm run improve:status` · `improve:next -- P0`
  - **DONE when:** Ralph-style picker works

- [x] **T3 — Pass 2 Windows wave (31 script fixes)**
  - **Files:** `app/package.json`, `preview-e2e.mjs`, `verify-all.mjs`, `run-e2e-stable.mjs`, `docs/WINDOWS_DEV.md`
  - **VERIFY:** `cd app && npm run lint` starts without `.. is not recognized`
  - **DONE when:** run-bin pattern on all app bins

- [x] **T4 — Pass 2 Survey API tests wave**
  - **Files:** `surveyRoutes.integration.test.ts` (+generate)
  - **VERIFY:** Vitest 16/16 passed
  - **DONE when:** generate route covered

- [x] **T5 — Pass 2 tsc-cleanup epic bootstrap**
  - **Files:** `features/tsc-cleanup/tasks.md`
  - **VERIFY:** epic created with T1–T3
  - **DONE when:** tasks.md with baseline plan

- [ ] **T6 — Pass 3 npm audit wave** *(blocked 2026-07-08: `npm audit fix` broke node_modules on Windows — use `npm run ci:install` / `cd app && npm ci` before retry)*
  - **Files:** `package-lock.json` (vite/undici safe bumps)
  - **VERIFY:** `npm audit --omit=dev` count reduced
  - **DONE when:** no new critical

- [x] **T7 — Pass 3 E2E coverage matrix**
  - **Files:** `docs/planning/API-COVERAGE.md`
  - **VERIFY:** survey P0 matrix + improve:next hint
  - **DONE when:** matrix starter complete

- [x] **T8 — Pass 3 mark done batch**
  - **Files:** `registry.jsonl` status updates
  - **VERIFY:** `improve:status` done > 50
  - **DONE when:** Windows + tooling items marked

- [ ] **T9 — Retro**
  - **Files:** `grok.md`, `HANDOFF.md`, `stash:sync`
  - **VERIFY:** `npm run stash:sync`
  - **DONE when:** checkpoint written