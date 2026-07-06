# Tasks — tsc-cleanup

**Feature:** Reduce 335 tsc errors in tsconfig.app.json  
**Domain:** D5  
**Status:** in_progress

---

## Tasks (30 — Rule of 3 batches)

- [ ] **T1 — Baseline + R3F global types**
  - **Files:** `app/src/types/react-three-fiber.d.ts`, `Twin3DViewer.tsx`
  - **VERIFY:** `cd app && node ../scripts/run-bin.mjs tsc --noEmit -p tsconfig.app.json 2>&1 | find /c "error"`
  - **DONE when:** animation cluster errors -50%

- [ ] **T2 — lucide-react icon aliases**
  - **Files:** admin sections using missing icons
  - **VERIFY:** tsc error count drop
  - **DONE when:** no TS2305 lucide exports

- [ ] **T3 — adminClient union narrowing**
  - **Files:** `app/src/admin/**/*.tsx`
  - **VERIFY:** tsc admin files clean
  - **DONE when:** 0 errors in AdminPanel cluster