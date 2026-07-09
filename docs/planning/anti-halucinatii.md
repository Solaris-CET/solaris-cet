# Anti-Halucinații — Protocol universal (v2.0 Mature)

**Versiune:** 2.0 Mature · **Companion:** `anti-halucinatii-loop.md`  
**Caz canon:** Grok Code a declarat progres fără commit; recuperare = `git diff` + pytest, nu memorie chat.

---

## §0 — Definiție operațională

**Halucinație** = orice propoziție despre cod, mediu, git, prod sau teste **fără dovadă din sesiunea curentă**.

Nu e „GPT a inventat o țară”. E **„agentul a pierdut bani și timp”**.

---

## §1 — Catalog incidente SOLARIS (din agent-memory)

| ID | Simptom | Dovadă cerută | Lecție |
|---|---|---|---|
| H-01 | `verify:all` recomandat | `package.json` scripts | L5 |
| H-02 | Push GitHub nu Gitea | `git remote -v` | L12 |
| H-03 | „User rulează teste” | — interzis | L7 |
| H-04 | Prod OK | `deploy:status` / curl health | L12 |
| H-05 | Route fără index.cjs | `surveyRouteRegistry.test.ts` | L6 |
| H-06 | `../node_modules/.bin` Windows | folosește npm scripts | L5 |
| H-07 | Sesiune întreruptă, „am terminat” | `git status` | Recovery § |
| H-08 | AUTOPROMPT stub done=true | pytest output | runner nu e verify |

---

## §2 — Ierarhia adevărului (cu override)

```
1. Command output (exit code, N passed)     ← singurul „adevăr final”
2. Read tool (path + line citation)
3. graphify query/path (graphify-out/graph.json)
4. Stash / agent-memory / HANDOFF           ← ipoteze, nu verdict
5. Model inference                          ← interzis ca verdict
```

**Override:** dacă HANDOFF spune DNS=Shopify și `deploy:status` zice altceva → crede HANDOFF + raw curl, investighează.

---

## §3 — Cele 12 Legi (cu enforcement)

| Law | Enforcement |
|---|---|
| L1 Read before write | Orchestrator reject diff fără paths în EVIDENCE |
| L2 Graphify first | `GRAPH_NODES` în checkpoint |
| L3 Stash first | `stash:prime` în VERIFIED |
| L4 Claim = proof | Citation sau command output |
| L5 No invented npm scripts | grep `package.json` |
| L6 No invented routes | `surveyOpenApi.ts` + `index.cjs` |
| L7 You run gates | „please test” = fail |
| L8 Fail loud | stderr în checkpoint |
| L9 State in files | tasks.md, HANDOFF |
| L10 Fresh context | max 3 retry |
| L11 P4 adversarial | review skill |
| L12 No fake git/deploy | `git log`, `deploy:status` |

---

## §4 — Checkpoint v2 (obligatoriu)

```
DONE: <factual, matches git diff>
VERIFIED: <cmd> → exit <n> / <N> passed
EVIDENCE: paths read: [...] · commands: [...]
OBSERVER: clear | warn:... | halt:...
HALLUCINATION_RISK: low|medium|high — <gaps>
LEFT: <uncommitted files if any>
BLOCKED: <HANDOFF blockers or ->
```

**Orchestrator:** respinge dacă lipsesc `VERIFIED` + `EVIDENCE`.

---

## §5 — Recovery protocol (copy-paste)

```bash
git status --short && git diff --stat
npm run loops:status
npm run stash:prime -- "recovery"
# Rerun task verify gate BEFORE new edits
```

---

## §6 — Model-specific traps (mature)

| Model | Trap | Counter |
|---|---|---|
| Grok 4.5 / Code | Overconfident plan, session drop | micro-loop + git truth |
| Kimi | Long context file mix-up | graphify path A→B |
| DeepSeek | Fast wrong API names | grep clients în `api_clients/` |
| Fable 5 | Plausible AHJ text fără sursă | `[NEEDS_AHJ_SOURCE]` tag |
| Haiku judge | Superficial ACCEPT | diff + test output only |

---

## §7 — Prompt (system)

```markdown
ANTI-HALUCINATII v2: Every claim needs session evidence. Hierarchy: command > read > graphify > stash > guess.
Checkpoint must include VERIFIED (literal), EVIDENCE, HALLUCINATION_RISK.
Never declare push/deploy/tests without running them this session.
```