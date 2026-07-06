# Tasks — go-to-market

> Ralph Outer Loop: `npm run loops:next -- go-to-market`

**Feature:** GTM strategy v3.3 — Rule of 3 × 3 loops + tooling  
**Domain:** D5 (Frontend + SEO) + D12 (orchestra)  
**Status:** done

---

## Tasks

- [x] **T1 — Pass 1 Foundation (v1.0→v1.3)**
  - **Files:** `GO-TO-MARKET-STRATEGY.md` §2–4, `research.md`
  - **MODEL:** Grok + DeepSeek (`loops:refine`)
  - **VERIFY:** Personas B2C/B2B + competition map present
  - **DONE when:** Pass 1 loops L1–L3 complete

- [x] **T2 — Pass 2 Integration (v2.0→v2.3)**
  - **Files:** `GO-TO-MARKET-STRATEGY.md` §5–7
  - **MODEL:** Grok
  - **VERIFY:** Channel funnel + pricing tiers + partner program
  - **DONE when:** Pass 2 loops L4–L6 complete

- [x] **T3 — Pass 3 Execution (v3.0→v3.3 FINAL)**
  - **Files:** `GO-TO-MARKET-STRATEGY.md` §8–13
  - **MODEL:** Grok + Sonnet 5 (pitch text gate)
  - **VERIFY:** 90/180/365 roadmap + KPI tables + risk matrix
  - **DONE when:** v3.3 version history audit trail

- [x] **T4 — Loops tooling upgrade**
  - **Files:** `scripts/loops-status.mjs`, `scripts/deepseek-refine.mjs`, `scripts/aider-run.mjs`, `package.json`
  - **MODEL:** DeepSeek (code)
  - **VERIFY:** `npm run loops:status` · `npm run loops:refine` manual mode
  - **DONE when:** scripts runnable without API key degrade

- [x] **T5 — Half-done task closure**
  - **Files:** `app/scripts/run-e2e-batched.mjs`, `scripts/deploy-status.mjs`
  - **VERIFY:** Windows `fileURLToPath` cwd fix · `deploy:status` SHA
  - **DONE when:** E2E batched starts server on Windows

- [x] **T6 — Retro + sync**
  - **Files:** `global.md`, `grok.md`, `SOLARIS-LOOPS-MASTER.md`
  - **VERIFY:** `npm run loops:status` all epics
  - **DONE when:** checkpoint in grok.md

---

## Progress log

| Date | Task | DONE | VERIFIED | BLOCKED |
|---|---|---|---|---|
| 2026-07-06 | T1–T3 GTM v3.3 | 3×3 loops doc | sections 0–13 | — |
| 2026-07-06 | T4 loops tooling | 3 scripts | loops:status OK | — |
| 2026-07-06 | T5 e2e Windows | fileURLToPath | pending e2e run | — |
| 2026-07-06 | T6 retro | grok.md | stash:sync | prod Hetzner |