# Tasks — tsc-cleanup

**Feature:** Reduce 335 tsc errors in tsconfig.app.json  
**Domain:** D5  
**Status:** superseded (2026-07-09)

> **Superseded:** Baseline din 2026-07-06 (335 erori) nu mai e valid. `cd app && npm run typecheck` + `npm run verify` trec verde (1834 Vitest, 2026-07-09 @ `7fd3a36c`). Epic închis — erorile R3F/lucide/admin au fost rezolvate în alte PR-uri sau nu se reproduc pe HEAD curent.

---

## Tasks (30 — Rule of 3 batches)

- [x] **T1 — Baseline + R3F global types** *(superseded — typecheck green)*
  - **Files:** `app/src/types/react-three-fiber.d.ts`, `Twin3DViewer.tsx`
  - **VERIFY:** `cd app && npm run typecheck` exit 0
  - **DONE when:** N/A — epic closed

- [x] **T2 — lucide-react icon aliases** *(superseded — typecheck green)*
  - **Files:** admin sections using missing icons
  - **VERIFY:** `cd app && npm run typecheck` exit 0
  - **DONE when:** N/A — epic closed

- [x] **T3 — adminClient union narrowing** *(superseded — typecheck green)*
  - **Files:** `app/src/admin/**/*.tsx`
  - **VERIFY:** `cd app && npm run typecheck` exit 0
  - **DONE when:** N/A — epic closed

---

| Date | Action | Result |
|---|---|---|
| 2026-07-09 | Pre-deploy audit | `npm run verify` 1834/1834 · typecheck în verify gate · epic marcat superseded |