# Superpowers — Plan & Verify Before Code (SOLARIS v2.0 Mature)

**Versiune:** 2.0 Mature · peste [obra/superpowers](https://github.com/obra/superpowers)  
**Skill:** `.agents/skills/superpowers/SKILL.md` · **Loop:** `superpowers-loops.md`  
**Dovadă în repo:** HARD-001/002/004 livrate doar după pytest 142 + vitest 1838 (2026-07-09)

---

## §0 — Ce înseamnă „adult” aici

obra/superpowers spune: verify before done.  
**SOLARIS v2 spune: verify before first product file read.**

Diferența e între un junior care „începe să codeze” și un principal care **știe ce rupe producția** înainte să atingă `survey-engine/src/server.py` sau `app/server/index.cjs`.

---

## §1 — Pre-Flight Gate (BLOCKER absolut)

### Interzis înainte de Pre-Flight PASS

- `Read` / `Write` / `StrReplace` pe `app/**`, `survey-engine/**` (cod produs)
- „Mă uit rapid la structură” fără graphify
- Subagent lansat fără brief

### Permis înainte de Pre-Flight

- `docs/planning/**`, `tasks.md`, `AGENTS.md`
- `npm run skills:prime`, `stash:prime`, `graphify:prime`, `graphify:suggest`
- `git status`, `git diff`, `git log -1`

---

## §2 — Cele 5 componente (cu rubrică de notare)

### 1. SPEC — criteriu de succes unic

**Format:** `Done când <comandă> returnează <rezultat observabil>.`

| Scor | Exemplu |
|---|---|
| 0 (respins) | „Twin replay funcționează” |
| 5 (acceptat) | `pytest tests/test_twin_runtime.py -q` → 10 passed |
| 5 (acceptat) | `vitest surveyRouteRegistry` → twin-replay în server index |

### 2. N-BEST — minim 2 abordări

Scor 1–5: **Verifiability** (×2 weight), Simplicity, Risk, Token cost.

**Exemplu HARD-001 replay:**

| # | Abordare | Verifiability | Ales? |
|---|---|---:|---|
| A | Seq în jsonl + GET /twin-replay | 5 | **DA** |
| B | Redis stream separat | 3 | Nu — infra nouă |
| C | Doar SSE fără replay | 2 | Nu — nu trece criteriu |

### 3. BLAST_RADIUS — din graphify, nu din cap

```bash
npm run graphify:suggest -- "<task>"
python -m graphify path "publish_twin_event" "useTwinStream"
```

Listează **max 15 path-uri**. Orice edit în afara listei → Observer HALT.

### 4. PRE-MORTEM — scenariu de eșec concret

**Șablon:** „Această soluție va eșua dacă ___; vom detecta prin ___; mitigare ___."

**Exemplu real:**
> Va eșua dacă `twin-replay` nu e înregistrat în `app/server/index.cjs` — Vite returnează HTML. Detectăm cu `surveyRouteRegistry.test.ts`. Mitigare: adaugă tuple + `surveyOpenApi.ts` SURVEY_ROUTE_IDS.

### 5. GATE_PLAN — verify după fiecare edit

| Step | Fișier | Gate (rulezi tu) |
|---:|---|---|
| 1 | `twin_runtime.py` `replay_twin_events` | `pytest test_twin_runtime.py::test_replay_from_seq` |
| 2 | `server.py` `/twin-replay` | `pytest` sau `curl localhost:8000/twin-replay` |
| 3 | `surveyTwinReplay.ts` + route | `vitest twinReplayRoute` |
| 4 | `useTwinStream.ts` | `vitest useTwinStream` |
| 5 | `index.cjs` registry | `vitest surveyRouteRegistry` |
| 6 | Global | `npm run verify:fast` sau `cd app && npm run verify` |

---

## §3 — Artifact obligatoriu (copy-paste)

```markdown
PRE-FLIGHT: PASS
SPEC: Done when pytest test_twin_* + vitest twin* pass and GET /api/survey/twin-replay proxies to engine.
APPROACH: #1 — jsonl seq replay (Verifiability=5, no new infra)
BLAST_RADIUS:
  - survey-engine/src/twin_runtime.py
  - survey-engine/src/twin_webhook.py
  - survey-engine/src/server.py
  - app/api/lib/surveyTwinReplay.ts
  - app/api/survey/twin-replay/route.ts
  - app/src/hooks/useTwinStream.ts
  - app/server/index.cjs
  - app/api/lib/surveyOpenApi.ts
PRE-MORTEM: Fails if bridge route missing from index.cjs; caught by surveyRouteRegistry.test.ts.
GATE_PLAN: [see table §2.5]
SKILLS_LOADED: superpowers, engineering, graphify, observer, verify
```

---

## §4 — Cele 7 Superpowers (operationalizate)

| # | Superpower | Enforcement în SOLARIS |
|---:|---|---|
| 1 | Spec-first | Orchestrator respinge fără SPEC cu comandă |
| 2 | TDD bond | `test_router.py` creat în același commit cu `router.py` |
| 3 | Subagent atomic | Brief ≤1 pagină; 1 verify command |
| 4 | Orchestrator skeptic | `VERIFIED` fără stderr = invalid |
| 5 | Red team P4 | `review` skill; lenses <8 → fix |
| 6 | Graphify scope | `graphify:suggest` în BLAST_RADIUS |
| 7 | No user testing | Încălcarea = anti-pattern în agent-memory |

---

## §5 — TDD bond — reguli SOLARIS

| Schimbare | Test obligatoriu |
|---|---|
| Route API nouă | `*Route.test.ts` sau `surveyRouteRegistry.test.ts` |
| Engine endpoint | `pytest` în `survey-engine/tests/` |
| Hook React | `vitest` + jsdom |
| OpenAPI contract | `surveyOpenApi.test.ts` / registry |
| Webhook idempotency | `test_twin_webhook.py` |

**Fără test = Pre-Flight incomplet = nu merge la Build.**

---

## §6 — Subagent packet (trimite DOAR asta)

```markdown
TASK: T2 — Add router stats bridge
SPEC: vitest routerStatsRoute + pytest test_router.py pass
BLAST_RADIUS: [lista]
FORBIDDEN: files outside list; drive-by refactors
VERIFY: cd survey-engine && python -m pytest tests/test_router.py -q
PRE-MORTEM: [1 paragraph]
TOKEN_BUDGET: 80
OBSERVER: report every 3 turns
```

---

## §7 — Orchestrator rejection catalog

| Motiv | Acțiune worker |
|---|---|
| No PRE-FLIGHT | Resubmit artifact |
| VERIFIED fără exit code | Rerun gate, paste output |
| Diff > BLAST_RADIUS | Revert extra files sau update plan |
| Behavior change, zero tests | Add tests, re-verify |
| `npm run verify:all` în plan | Fix — script nu există |

---

## §8 — Diferență obra vs SOLARIS v2 Mature

| Dimensiune | obra | SOLARIS v2 |
|---|---|---|
| Timing verify | End | Every edit + end |
| Plan artifact | Sugestie | BLOCKER |
| Bridge registry | N/A | `index.cjs` + OpenAPI obligatoriu |
| Windows | Rare | `run-bin.mjs`, Git Bash |
| Prod | N/A | HANDOFF BLOCKER explicit |
| Cost | N/A | token-clock burn post-verify |

---

## §9 — Prompt system (production)

```markdown
SUPERPOWERS SOLARIS v2.0 MATURE — Laws:
1. PRE-FLIGHT PASS required before any Read/Write on app/ or survey-engine/.
2. BLAST_RADIUS from graphify:suggest — max 15 paths.
3. GATE_PLAN: run gate after EACH edit; paste outputs.
4. TDD: tests same commit as behavior.
5. Orchestrator rejects DONE without literal VERIFIED.
Read: docs/planning/superpowers.md §2 artifact template.
```