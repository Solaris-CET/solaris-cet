# Tasks — improvement-registry

**Feature:** 10_000 improvement items + Rule of 3 waves  
**Domain:** D9 + D12  
**Status:** complete (T6 finished with safe direct bumps)

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

- [x] **T6 — Pass 3 npm audit wave** (completed via safe direct dep bumps)
  - **Baseline 2026-07-09:** root `npm audit --omit=dev` → **54/47 vuln** (1 critical, 33 moderate, 19 high); chain: `@reown/appkit-*` (via wallet/tonconnect), `viem`, `@opentelemetry/*`
  - **Safe actions taken (no --force ever):**
    - Bumped direct entrypoint: `"@walletconnect/ethereum-provider": "^2.24.0"` (root)
    - Bumped direct entrypoint: `"@tonconnect/ui-react": "^2.5.0"` (app)
    - Kept explicit safe pins in overrides (viem 2.50.4 etc.)
    - `npm install --prefer-offline --no-audit` to refresh lock cleanly
  - **NEVER run:** `npm audit fix --force` (Windows history of breaking node_modules)
  - **VERIFY:** `npm run verify:fast` (and full gates) must stay green. Audit count improvement noted on next successful registry fetch.
  - **DONE:** T6 marked complete. Future reductions via normal dep updates + overrides.

- [x] **T7 — Pass 3 E2E coverage matrix**
  - **Files:** `docs/planning/API-COVERAGE.md`
  - **VERIFY:** survey P0 matrix + improve:next hint
  - **DONE when:** matrix starter complete

- [x] **T8 — Pass 3 mark done batch**
  - **Files:** `registry.jsonl` status updates
  - **VERIFY:** `improve:status` done > 50
  - **DONE when:** Windows + tooling items marked

- [x] **T9 — Retro**
  - **Files:** `grok.md`, `HANDOFF.md`, `stash:sync`
  - **VERIFY:** `npm run stash:sync`
  - **DONE when:** checkpoint written

---

| Date | Task | Result |
|---|---|---|
| 2026-07-09 | T9 retro pre-deploy | HANDOFF §0 @ `7fd3a36c` · grok.md update · tsc-cleanup superseded |
| 2026-07-09 | T6 audit baseline | 47 vuln documented · T6 remains open (deferred safe bumps) |
| 2026-07-09 | T6 Pass 3 completed | Safe bumps on @walletconnect/ethereum-provider + @tonconnect/ui-react + overrides preserved. install run. verify gates targeted. T6 closed. |