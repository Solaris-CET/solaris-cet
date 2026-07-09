# Find Loops Skills — Routing per fază Perfect Loop (v2.0 Mature)

**Versiune:** 2.0 Mature · **2026-07-09**  
**Companion:** `find-skills.md` · `SOLARIS-LOOPS-MASTER.md` · `anti-halucinatii-loop.md`  
**Audiență:** orchestratori Ralph + workeri care rulează inner loops 0–7, nu „am citit AGENTS.md o dată”

---

## §0 — Adult brief (30 secunde)

`find-skills.md` spune **ce** skills există. Acest fișier spune **când** le încarci în fiecare loop — și ce gate respinge munca dacă sari peste ele.

**Neonat:** rulează `loops:next` și începe să editeze.  
**Adult:** Loop 0 Memory → skills:prime + stash + graphify → Loop 1 Pre-Flight → abia apoi Build.

Fără maparea de mai jos, orchestratorul tratează output-ul ca **neonat** indiferent de model.

---

## §1 — De ce există (incidente din teren)

| Incident | Loop rupt | Skill lipsă | Fix v2 |
|---|---|---|---|
| Grok Code: 101 fișiere necommitate, terminal închis | 7 Retro | `memoria` + `anti-halucinatii` | Recovery înainte de edit nou |
| Agent editează `app/` fără graphify | 0b Graph | `graphify` | `GRAPH_NODES` obligatoriu |
| „Twin replay gata” fără `index.cjs` | 2 Build | `observer` S1 | BLAST_RADIUS din Pre-Flight |
| Subagent primește tot thread-ul | 5 Agent | `find-skills` routing | Packet 1 paragraf |
| `tasks.md [x]` fără pytest | 7 Retro | `verify` + `anti-halucinatii` | gate înainte de sync |
| AUTOPROMPT `done=true` stub | 3 Verify | `observer` + `verify` | VERIFIED literal |

---

## §2 — Mapare Loop → Skills (ordine strictă)

| Loop | Fază AEP | Skills (ordine) | Doc principal | Gate blocant |
|---:|---|---|---|---|
| **0** Memory | P0 | `find-skills` → `memoria` → `loops` | `memoria.md`, `loop-memory.md` | `MEMORY_PRIME` scris |
| **0b** Graph | P0 | `graphify` | `graphify-out/`, `GRAPH_REPORT.md` | ≥5 `GRAPH_NODES` reale |
| **1** Research | P1 | `superpowers` → `engineering` | `superpowers-loops.md` | `PRE-FLIGHT: PASS` |
| **2** Build | P2 | `engineering` → `observer` → `anti-halucinatii` | `anti-halucinatii-loop.md` | gate_mic după fiecare edit |
| **3** Verify | P3 | `verify` → `anti-halucinatii` | verify skill | exit code + N passed |
| **4** Optimize | P5 | `engineering` → `token-clock` | `token-clock-loop.md` | escalare justificată |
| **5** Agent | P5 | `find-skills` → `observer` | `grok-loop-observer.md` | brief + verify per subagent |
| **6** Feedback | P6 | `memoria` → `observer` | `grok.md` | doar fapte, nu roadmap |
| **7** Retro | P6 | `memoria` → `loops` → `token-clock` | `agent-memory.md` | `stash:sync` după verify |

**Regulă:** Loop N+1 **nu pornește** dacă gate-ul Loop N lipsește din checkpoint.

---

## §3 — AUTOPROMPT overlay (fază × skill)

| Fază AUTOPROMPT | Skills obligatorii | Interzis |
|---|---|---|
| **PRIME** | find-skills, memoria, graphify | Read pe `app/`, `survey-engine/` |
| **DECOMPOSE** | superpowers, token-clock (estimate) | subtask fără `verify_command` |
| **PLAN** | superpowers, observer | edit produs |
| **EXECUTE** | engineering, observer, anti-halucinatii | edit fără gate_mic |
| **VERIFY** | verify, anti-halucinatii | „ar trebui să treacă” |
| **CRITIQUE** | review, observer | ACCEPT fără lentile 1–3 |
| **HANDOFF** | memoria, token-clock:burn | burn înainte de verify verde |

Lock AUTOPROMPT v5 țintă: `EXECUTE` refuzat dacă `pre_flight: pass` lipsește din `.autoprompt/state-*.json`.

---

## §4 — Ralph outer loop (runbook complet)

```bash
# RALPH-0 — sursă task (nu inventa)
npm run loops:next
# Dacă „No open tasks” → 10_HARD_RANDOM_TASKS.md sau improve:next

# RALPH-1 — Loop 0 + 0b
GOAL="$(npm run loops:next 2>&1 | tail -1)"   # sau slug explicit
npm run skills:prime -- "$GOAL"
npm run stash:prime -- "$GOAL"
npm run graphify:prime -- "$GOAL"

# RALPH-2 — Loop 1 Pre-Flight (artifact în chat/state)
# Completează superpowers.md §3 artifact

# RALPH-3 — Inner 2–7
# ... build, verify, observer, retro ...

# RALPH-4 — închidere epic
npm run verify:fast                    # sau gate din task
npm run token-clock:burn -- --task "<task-id>" --tokens <estimate>
npm run stash:sync
# [x] în tasks.md DOAR dacă gate task a trecut
```

### Checkpoint Ralph (obligatoriu)

```
LOOP_PHASE: 7 Retro complete
SKILLS_LOADED: find-skills, memoria, superpowers, verify, observer, token-clock
MEMORY_PRIME: <stash_hits + graph_nodes>
PRE-FLIGHT: PASS
VERIFIED: <comandă literală + exit 0>
OBSERVER: clear
TOKENS_BURNED: <N> remaining=<M>
```

---

## §5 — Subagent brief template (mature)

Trimite **doar** acest pachet — nu thread, nu GRAPH_REPORT complet:

```markdown
## Subagent packet (SOLARIS v2)

GOAL: <o propoziție>
LOOP_PHASE: 2 Build
SKILLS_LOADED: find-skills, superpowers, observer, verify
PRE-FLIGHT: PASS (copy SPEC + BLAST_RADIUS + GATE_PLAN)
BLAST_RADIUS:
  - path/1
  - path/2
SUCCESS: <o comandă verify>
FORBIDDEN: edit outside BLAST_RADIUS; skip gate_mic; mark done without verify
TOKEN_BUDGET: <N>
OBSERVER: report OBSERVER: clear|warn|halt every 3 turns
RETURN: DONE / VERIFIED / EVIDENCE / OBSERVER — orchestrator re-rulează gate
```

**Orchestrator:** respinge return dacă lipsește `VERIFIED` cu output literal sau `OBSERVER: halt` nesters.

---

## §6 — Exemple SOLARIS (task → skills)

### HARD-001 Twin replay

```bash
npm run skills:prime -- "HARD-001 twin replay catch-up"
npm run graphify:suggest -- "twin replay"
```

| Loop | Acțiune | Skills active |
|---|---|---|
| 0 | stash: prime twin, HANDOFF | memoria |
| 0b | nodes: twin_runtime.py, useTwinStream.ts | graphify |
| 1 | Pre-Flight 8 paths, GATE_PLAN 6 steps | superpowers |
| 2 | replay_twin_events + route + hook | engineering, observer |
| 3 | pytest 10 + vitest twin* | verify |
| 7 | burn ~95 tokens, stash:sync | token-clock, memoria |

### HARD-004 Router stats

Skills: `engineering`, `graphify`, `superpowers`, `observer`  
Verify: `pytest tests/test_router.py` + `vitest` route registry  
Blast: `router.py`, `app/api/survey/router/stats/`

### Recovery (Grok Code întrerupt)

Skills: **memoria**, **anti-halucinatii**, find-skills (re-prime)  
**Înainte de orice skill de build:**

```bash
git status --short
git diff --stat
npm run stash:prime -- "recovery interrupted session"
```

---

## §7 — Arbore decizie per loop (quick)

```
loops:next output?
├─ task în tasks.md → skills:prime cu slug task
├─ „No open tasks” → 10_HARD_RANDOM_TASKS.md → skills:prime cu HARD-00N
└─ improve:next → engineering + superpowers default

Loop 1 blocat?
├─ PRE-FLIGHT lipsă → superpowers, NU Build
├─ GRAPH_NODES < 5 → graphify:prime, NU grep masiv
└─ HANDOFF blocker → memoria, NU promite prod

Loop 5 subagent?
├─ atomic subtask → packet §5
├─ epic întreg → SPLIT — max 1 subtask per agent
└─ fără verify_command → REJECT la DECOMPOSE
```

---

## §8 — Rubrică maturitate (neonat vs adult)

| Criteriu | Neonat (v1) | Adult (v2) |
|---|---|---|
| Loop 0 | sare direct la cod | `MEMORY_PRIME` + `GRAPH_NODES` |
| Loop 1 | „mă uit la structură” | Pre-Flight artifact scris |
| Loop 2 | edit batch, verify la final | gate_mic după fiecare fișier |
| Loop 5 | subagent = tot contextul | packet §5, TOKEN_BUDGET |
| Loop 7 | `[x]` din entuziasm | verify verde → burn → sync |
| Ralph | inventează taskuri | `loops:next` sau HARD registry |

---

## §9 — Respingere orchestrator

```markdown
REJECTED — Find Loops Skills v2.0
Loop attempted: 2 Build
Missing: PRE-FLIGHT from Loop 1 | GRAPH_NODES from Loop 0b
Required:
  npm run skills:prime -- "<goal>"
  Complete superpowers-loops.md Pre-Flight
  Do not advance to Loop 2 until Loop 1 gate PASS
```

---

## §10 — Comenzi rapide

```bash
npm run loops:next
npm run loops:status
npm run skills:prime -- "<topic>"
npm run stash:prime -- "<topic>"
npm run graphify:prime -- "<topic>"
npm run graphify:suggest -- "<topic>"
npm run token-clock:status
npm run stash:sync
```

**Părinte:** `find-skills.md` · **Master:** `SOLARIS-LOOPS-MASTER.md` · **Anti-halucinație per fază:** `anti-halucinatii-loop.md`